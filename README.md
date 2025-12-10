# 🚀 LinkBrandAI — AI-Powered Career Assistant

LinkBrandAI is a full-stack AI application designed to supercharge your career.  
It uses **Google Gemini AI**, **resume intelligence**, and **smart job-matching algorithms** to help professionals grow faster.

---

## 🟦 LinkedIn-Themed Feature Set

### 📄 **AI Resume Analyzer**
- Upload any PDF resume
- Get ATS score instantly
- Extract missing keywords
- Years of experience calculation
- Skill gap detection

### ✍️ **AI LinkedIn Post Generator**
- Write viral-ready professional posts
- Powered by Gemini AI (1.5 Flash)
- Auto-formatting for LinkedIn tone

### 🎯 **Smart Job Matcher**
- Match resume to job descriptions
- Get match percentage
- Identify strengths + weaknesses

### 💼 **Real-Time Job Board**
- Fetches live jobs from:
  - LinkedIn  
  - Indeed  
  - Glassdoor  
- Using **RapidAPI – JSearch**

### 📊 **Career Dashboard**
- Analytics on your profile strength
- Activity insights
- AI recommendations

---

## 🛠️ Tech Stack

### **Frontend**
- React.js  
- Vite  
- Tailwind CSS  
- Lucide React

### **Backend**
- Python  
- FastAPI  
- SQLAlchemy  
- Pydantic

### **AI Engine**
- Google Gemini 1.5 Flash

### **APIs**
- RapidAPI – JSearch

### **Deployment**
- Vercel (Frontend)  
- Render (Backend)

---
<img width="1600" height="869" alt="image" src="https://github.com/user-attachments/assets/c7f98179-f12b-479b-bfbe-1d12c7f84eb3" />


## ⭐ Badges (LinkedIn Style)

![Python](https://img.shields.io/badge/Python-0A66C2?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-004182?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-0A66C2?style=for-the-badge&logo=react&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-004182?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-0A66C2?style=for-the-badge&logo=render&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-004182?style=for-the-badge&logo=google&logoColor=white)
![LinkedIn](https://img.shields.io/badge/LinkedIn_API-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)

---

## 🚀 Installation

### **1. Clone the Repository**
```bash
git clone https://github.com/YOUR_USERNAME/LinkBrandAI.git
cd LinkBrandAI

2. Backend Setup
cd backend
python -m venv venv

Activate:

Windows

venv\Scripts\activate


Mac/Linux

source venv/bin/activate

Install dependencies:
pip install -r requirements.txt

Add your environment variables:

backend/.env

GEMINI_API_KEY=your_google_gemini_key
RAPIDAPI_KEY=your_rapidapi_key

Run backend:
uvicorn api.main:app --reload

3. Frontend Setup
cd frontend
npm install
npm run dev

📁 Project Structure
LinkBrandAI/
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   ├── ai_agent.py
│   │   ├── jobs.py
│   │   ├── database.py
│   │   └── models.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── JobBoard.jsx
│   │   │   └── ProfileAnalyzer.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md

🤝 Contributing

Pull requests are welcome.
For major changes, open an issue first to discuss what you'd like to improve.

📄 License

This project is under the MIT License.

