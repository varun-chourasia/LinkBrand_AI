from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, InvalidArgument, NotFound
import os
import httpx
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# DB Imports
from api.database import get_db
from api.models import User, Post

load_dotenv()

router = APIRouter()
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

CANDIDATE_MODELS = [
    "gemini-2.5-flash",      # Put the working one FIRST
    "gemini-1.5-flash",      # Backup
    "gemini-2.0-flash-exp"   
]

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

class PostRequest(BaseModel):
    topic: str
    tone: str = "Professional"
    author_style: str = "" 

class PublishRequest(BaseModel):
    token: str
    text: str
    visibility: str = "PUBLIC"

@router.post("/generate/post")
async def generate_post(
    request: PostRequest,
    db: Session = Depends(get_db)
):
    if not GOOGLE_API_KEY: 
        return {"content": "Error: GEMINI_API_KEY not found in .env file."}

    # --- ROBUST LOOP: Try models one by one ---
    for model_name in CANDIDATE_MODELS:
        try:
            # print(f"Attempting with {model_name}...") 
            model = genai.GenerativeModel(model_name)
            
            prompt = (
                f"Write a LinkedIn post about {request.topic} (Tone: {request.tone}). "
                "Return ONLY the post text. No intro. Keep it under 200 words."
            )

            response = model.generate_content(prompt)
            
            if response.text:
                clean_text = response.text.strip().replace('"', '')

                # SAVE TO DATABASE (Only on Success)
                try:
                    user = db.query(User).first()
                    if user:
                        new_post = Post(content=clean_text, user_id=user.id)
                        db.add(new_post)
                        db.commit()
                except Exception as db_err:
                    print(f"Database Error (Non-fatal): {db_err}")

                print(f"✅ Success using model: {model_name}")
                return {"content": clean_text}

        except (ResourceExhausted, InvalidArgument, NotFound) as e:
            print(f"⚠️ Failed with {model_name}: {e}")
            continue # Try the next model in the list
            
        except Exception as e:
            print(f"❌ Error with {model_name}: {e}")
            continue

    # --- FALLBACK: If loop finishes and nothing worked ---
    print("⚠️ All AI models failed. Returning Mock Response.")
    mock_text = (
        f"⚠️ (AI Unavailable) \n\n"
        f"We hit the daily quota limit on the free tier.\n\n"
        f"Here is a template for '{request.topic}':\n\n"
        f"I'm excited to share my latest thoughts on {request.topic}. It's changing the way we work! 🚀\n\n"
        f"#Tech #Innovation #{request.topic.replace(' ', '')}"
    )
    
    return {"content": mock_text}

@router.post("/publish/linkedin")
async def publish_post(request: PublishRequest):
    if not request.token:
        raise HTTPException(status_code=401, detail="No token provided")

    async with httpx.AsyncClient() as client:
        # 1. Fetch User ID
        me_res = await client.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization": f"Bearer {request.token}"})
        if me_res.status_code != 200:
            raise HTTPException(status_code=400, detail="ID Fetch Failed")
        
        user_id = me_res.json().get("sub")
        
        # 2. Publish Post
        post_url = "https://api.linkedin.com/v2/ugcPosts"
        payload = {
            "author": f"urn:li:person:{user_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": request.text},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": request.visibility}
        }

        headers = {
            "Authorization": f"Bearer {request.token}", 
            "Content-Type": "application/json", 
            "X-Restli-Protocol-Version": "2.0.0"
        }
        
        response = await client.post(post_url, json=payload, headers=headers)
        
        if response.status_code != 201:
            raise HTTPException(status_code=400, detail=f"LinkedIn Rejected: {response.json().get('message')}")
            
        return {"status": "success", "post_id": response.json().get("id")}