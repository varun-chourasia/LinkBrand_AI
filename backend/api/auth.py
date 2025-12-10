import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from urllib.parse import quote

# Import our new Database tools
from api.database import get_db
from api.models import User, Base
from api.database import engine

# Create the tables if they don't exist yet
Base.metadata.create_all(bind=engine)

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")

@router.get("/login")
def login():
    # We request permissions to read profile (openid), email, and post (w_member_social)
    scope = "openid profile email w_member_social"
    linkedin_auth_url = (
        f"https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={scope}"
    )
    return RedirectResponse(linkedin_auth_url)

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    """
    1. Exchange Code for Token
    2. Get User Info
    3. SAVE User to Database
    4. Redirect to Dashboard
    """
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")

    # --- A. Exchange Code for Token ---
    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    params = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=params)
        token_json = token_response.json()
        
        if "access_token" not in token_json:
            raise HTTPException(status_code=400, detail=f"LinkedIn Error: {token_json.get('error_description')}")
        
        access_token = token_json["access_token"]

        # --- B. Get User Info ---
        user_info_url = "https://api.linkedin.com/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        user_response = await client.get(user_info_url, headers=headers)
        user_data = user_response.json()

    # --- C. SAVE TO DATABASE (The New Part) ---
    linkedin_id = user_data.get("sub")
    name = user_data.get("given_name", "User")
    pic = user_data.get("picture", "")

    # Check if user exists
    db_user = db.query(User).filter(User.linkedin_id == linkedin_id).first()
    
    if not db_user:
        # Create new user
        db_user = User(linkedin_id=linkedin_id, name=name, pic_url=pic)
        db.add(db_user)
        db.commit()
    else:
        # Update existing user (in case they changed their photo)
        db_user.name = name
        db_user.pic_url = pic
        db.commit()

    # --- D. Redirect to Frontend ---
    safe_name = quote(name)
    safe_pic = quote(pic)
    
    # We pass the token so the frontend can still use it for posting
    frontend_redirect = f"{FRONTEND_URL}/dashboard?token={access_token}&name={safe_name}&pic={safe_pic}"
    
    return RedirectResponse(url=frontend_redirect)