from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
import os
from pypdf import PdfReader
import io
import json
import re
import time
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# DB & Internal Imports
from api.database import get_db
from api.models import User
from api.scraper import scrape_linkedin_profile  # Ensure api/scraper.py exists

load_dotenv()
router = APIRouter()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

# --- MODEL SETUP ---
model = None
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
    except:
        model = genai.GenerativeModel('gemini-pro')

# --- HELPER: CLEAN JSON ---
def clean_json_response(text):
    # Remove markdown code blocks and extra text
    clean = text.replace("```json", "").replace("```", "").strip()
    match = re.search(r'\{.*\}', clean, re.DOTALL)
    if match: return match.group(0)
    return "{}"

# --- HELPER: SMART AI CALLER (THE FIX) ---
def ask_gemini_with_retry(prompt):
    """
    Tries to call Gemini. If it hits a 429 (Rate Limit), 
    it waits 5 seconds and tries again.
    """
    retries = 0
    max_retries = 3
    
    while retries < max_retries:
        try:
            return model.generate_content(prompt)
        except Exception as e:
            if "429" in str(e):
                print(f"⚠️ Quota Hit. Waiting 5 seconds... (Attempt {retries+1}/{max_retries})")
                time.sleep(5) # Wait for quota to reset
                retries += 1
            else:
                # If it's a real error (not quota), raise it immediately
                raise e
    
    raise Exception("Max retries exceeded")

# --- HELPER: FALLBACK DATA ---
def get_fallback_linkedin():
    return {
        "top_experience": "Analysis Limit Reached",
        "years_experience": "0",
        "connections_count": "--",
        "summary_rating": 0,
        "feedback_list": ["You hit the AI speed limit (5 req/min).", "Please wait 10 seconds and try again."]
    }

def get_fallback_resume():
    return {
        "ats_score": 0,
        "top_skills": ["Speed Limit Hit"],
        "missing_sections": "Wait 10s",
        "feedback_list": ["System is cooling down", "Try again in a moment"]
    }

# --- DATA MODELS ---
class ScrapeRequest(BaseModel):
    url: str

# ==========================================
# API 1: URL SCRAPER (RESTORED!)
# ==========================================
@router.post("/analyze/scrape-url")
async def analyze_url(request: ScrapeRequest, db: Session = Depends(get_db)):
    print(f"--- DEBUG: Scraping URL: {request.url} ---")
    
    # 1. Run Selenium
    scraped_data = scrape_linkedin_profile(request.url)
    
    if not scraped_data:
        raise HTTPException(status_code=400, detail="Scraping failed. Check server logs.")

    # 2. Analyze with AI
    if not model: return {"error": "AI Key Missing"}

    prompt = (
        "Analyze this Scraped LinkedIn Data. Extract strict JSON:\n"
        "1. 'top_experience': Current Role or Headline.\n"
        "2. 'years_experience': Estimate from text.\n"
        "3. 'connections_count': '500+' (Default).\n"
        "4. 'summary_rating': 0-100.\n"
        "5. 'feedback_list': 3 tips.\n"
        "Return ONLY JSON.\n"
        f"DATA:\n{scraped_data['raw_text'][:6000]}"
    )

    try:
        response = ask_gemini_with_retry(prompt)
        data = json.loads(clean_json_response(response.text))
        
        # 3. Save to DB
        user = db.query(User).first()
        if user:
            user.profile_summary = json.dumps(data)
            db.commit()
            
        return data
    except Exception as e:
        print(f"AI Error: {e}")
        return get_fallback_linkedin()

# ==========================================
# API 2: LINKEDIN PDF ANALYZER
# ==========================================
@router.post("/analyze/linkedin")
async def analyze_linkedin(file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"--- DEBUG: LinkedIn Analysis Started for {file.filename} ---")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Upload a PDF.")

    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        text = "".join([page.extract_text() or "" for page in reader.pages])

        if len(text) < 50: return get_fallback_linkedin()
        if not model: return get_fallback_linkedin()

        prompt = (
            "Analyze this LinkedIn Profile PDF. Extract fields in strict JSON:\n"
            "1. 'top_experience': Most recent role.\n"
            "2. 'years_experience': Number of years.\n"
            "3. 'connections_count': Extract number from '500+ connections'.\n"
            "4. 'summary_rating': 0-100.\n"
            "5. 'feedback_list': Array of 3 tips.\n"
            "Return ONLY JSON.\n"
            f"TEXT:\n{text[:6000]}"
        )

        response = ask_gemini_with_retry(prompt)
        data = json.loads(clean_json_response(response.text))

        # Save to DB
        user = db.query(User).first()
        if user:
            user.profile_summary = json.dumps(data)
            db.commit()

        return data

    except Exception as e:
        print(f"CRITICAL ERROR (LinkedIn): {e}")
        return get_fallback_linkedin()

# ==========================================
# API 3: RESUME / CV ANALYZER
# ==========================================
@router.post("/analyze/resume")
async def analyze_resume(file: UploadFile = File(...)):
    print(f"--- DEBUG: Resume Analysis Started for {file.filename} ---")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Upload a PDF.")

    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        text = "".join([page.extract_text() or "" for page in reader.pages])

        if len(text) < 50: return get_fallback_resume()
        if not model: return get_fallback_resume()

        prompt = (
            "Act as a Hiring Manager. Analyze this Resume. Extract strict JSON:\n"
            "1. 'ats_score': 0-100.\n"
            "2. 'top_skills': List of 5 hard skills.\n"
            "3. 'missing_sections': What is missing?.\n"
            "4. 'feedback_list': 3 formatting fixes.\n"
            "Return ONLY JSON.\n"
            f"RESUME TEXT:\n{text[:6000]}"
        )

        response = ask_gemini_with_retry(prompt)
        data = json.loads(clean_json_response(response.text))
        return data

    except Exception as e:
        print(f"CRITICAL ERROR (Resume): {e}")
        return get_fallback_resume()