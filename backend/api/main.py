from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from pypdf import PdfReader
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
import json
import io
import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

# Import your features
from api.auth import router as auth_router
from api.analysis import router as analysis_router
from api.jobs import router as jobs_router
from api.ai_agent import router as ai_router
from api.database import get_db, engine, Base
from api.models import User, Post

load_dotenv()

# --- CONFIGURATION ---
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Use the model that worked for you in the logs
AI_MODEL_NAME = "gemini-2.5-flash" 

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
app.include_router(jobs_router, prefix="/api", tags=["Jobs"])
app.include_router(ai_router, prefix="/api", tags=["AI"])

@app.get("/")
def read_root():
    return {"status": "LinkBrand AI is running"}

# --- REAL AI RESUME ANALYZER ---
@app.post("/api/analyze/profile-pdf")
async def analyze_profile_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        # 1. Extract Text from PDF
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() or ""

        if len(extracted_text.strip()) < 50:
             raise HTTPException(status_code=400, detail="PDF seems empty or is an image.")

        # 2. Prepare AI Prompt
        # We ask Gemini to act as an ATS Scanner and return strict JSON
        prompt = f"""
        Act as an expert ATS (Applicant Tracking System) Resume Scanner. 
        Analyze the resume text below.
        
        Return a valid JSON object with exactly these keys:
        - "score": (integer 0-100 based on keyword density, formatting, and impact)
        - "years_experience": (integer, estimated from the dates in text)
        - "top_skills": (list of strings, top 5 technical skills found)
        - "feedback": (list of 3 specific strings telling the candidate how to improve. Be critical.)
        - "missing_keywords": (list of 3 important industry keywords that seem missing based on the context)

        RESUME TEXT:
        {extracted_text[:3000]} 
        """

        # 3. Call Gemini AI
        model = genai.GenerativeModel(AI_MODEL_NAME)
        response = model.generate_content(prompt)
        
        # 4. Parse AI Response (Clean up JSON)
        ai_data = {}
        try:
            # Remove markdown code blocks if AI adds them (e.g. ```json ... ```)
            clean_json = response.text.replace("```json", "").replace("```", "").strip()
            ai_data = json.loads(clean_json)
        except:
            # Fallback if AI output is messy
            print("⚠️ AI JSON Parsing failed. Using fallback stats.")
            ai_data = {
                "score": 65,
                "years_experience": 2,
                "top_skills": ["Communication", "Analysis"],
                "feedback": ["Could not parse AI details. Ensure resume text is clear.", "Add more quantifiable results.", "Check date formatting."],
                "missing_keywords": ["Leadership", "Python", "Agile"]
            }

        # 5. Return Data to Frontend
        return {
            "status": "success",
            "filename": file.filename,
            "extracted_text": extracted_text[:200],
            
            # Map AI data to what Frontend expects
            "years": ai_data.get("years_experience", 0),
            "score": ai_data.get("score", 0),
            "posts": 0,
            
            # These lists will populate your "Improvement Plan" and "Skills" tags
            "feedback_list": ai_data.get("feedback", []),
            "skills": ai_data.get("top_skills", []),
            "missing": ai_data.get("missing_keywords", [])
        }

    except Exception as e:
        print(f"Error processing PDF: {e}")
        # Return a soft error so the UI doesn't crash completely
        return {
            "status": "partial_error",
            "years": 0, "score": 0, "posts": 0,
            "feedback_list": ["Server Error: " + str(e)],
            "skills": []
        }

# --- JOB MATCHER (UPDATED TO USE AI TOO) ---
@app.post("/api/analyze/match-job")
async def match_job(
    resume: UploadFile = File(...), 
    job_description: str = Form(...)
):
    try:
        # 1. Read Resume
        content = await resume.read()
        reader = PdfReader(io.BytesIO(content))
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() or ""
            
        # 2. AI Prompt for Matching
        prompt = f"""
        Compare this Resume against the Job Description.
        
        JOB DESCRIPTION:
        {job_description[:1000]}
        
        RESUME:
        {resume_text[:1000]}
        
        Return JSON:
        {{
            "match_score": (integer 0-100),
            "analysis": (string, 2 sentences explaining why it fits or doesn't),
            "missing_skills": (list of strings)
        }}
        """
        
        model = genai.GenerativeModel(AI_MODEL_NAME)
        response = model.generate_content(prompt)
        
        # Parse JSON
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)

        return {
            "match_score": data.get("match_score", 50),
            "analysis": data.get("analysis", "Analysis complete."),
            "missing_sections": ", ".join(data.get("missing_skills", []))
        }
    except Exception as e:
        print(f"Error matching job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Endpoint to Fetch User Data on Refresh ---
@app.get("/api/user/data")
def get_user_data(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        return {"stats": None, "posts": []}
    
    try:
        stats = json.loads(user.profile_summary) if user.profile_summary else None
    except:
        stats = None
        
    posts = [p.content for p in user.posts][::-1]
    
    return {
        "stats": stats,
        "posts": posts
    }

if __name__ == "__main__":
    uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=True)