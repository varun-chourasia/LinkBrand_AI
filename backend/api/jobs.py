from fastapi import APIRouter, HTTPException
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Get Key from .env (Add RAPIDAPI_KEY=your_key to your .env file)
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = "jsearch.p.rapidapi.com"

@router.get("/jobs/recommend")
async def recommend_jobs(skill: str = "Python"):
    if not RAPIDAPI_KEY:
        print("⚠️ No API Key found. Returning Mock Data.")
        # Fallback to mock data if key is missing
        return {
            "status": "mock",
            "jobs": [
                {"id": 1, "title": "Mock Python Job", "company": "Test Co", "location": "Remote", "link": "#"}
            ]
        }

    url = "https://jsearch.p.rapidapi.com/search"
    
    # Customize query: "Python developer in USA", etc.
    querystring = {"query": f"{skill} developer", "page": "1", "num_pages": "1"}

    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"🌍 Fetching real jobs for: {skill}...")
            response = await client.get(url, headers=headers, params=querystring)
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code}")
                raise HTTPException(status_code=500, detail="External API Error")

            data = response.json()
            raw_jobs = data.get("data", [])

            # Transform their data format to match YOUR frontend
            clean_jobs = []
            for job in raw_jobs[:10]: # Limit to 10 jobs
                clean_jobs.append({
                    "id": job.get("job_id"),
                    "title": job.get("job_title"),
                    "company": job.get("employer_name"),
                    "location": job.get("job_city") or "Remote",
                    "platform": job.get("job_publisher") or "LinkedIn",
                    "link": job.get("job_apply_link")
                })

            return {
                "status": "success",
                "count": len(clean_jobs),
                "jobs": clean_jobs
            }

        except Exception as e:
            print(f"❌ Job Fetch Error: {e}")
            return {"status": "error", "jobs": []}