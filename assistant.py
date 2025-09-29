from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from io import BytesIO
from datetime import datetime
import os, re, random

from groq import Groq
from constants import (
    GROQ_API_KEY, APP_HOST, APP_PORT,
    DEFAULT_ROLE, DEFAULT_COUNTS, DEFAULT_SEED,
    DIFFICULTY_WEIGHTS, MAX_FILE_SIZE, SUPPORTED_FILE_TYPES, MAX_TEXT_LENGTH
)

# ============================
# Resume parsing utilities
# ============================
try:
    import pypdf
    def extract_pdf_text(file_stream):
        reader = pypdf.PdfReader(file_stream)
        return "".join([page.extract_text() or "" for page in reader.pages])
except ImportError:
    def extract_pdf_text(file_stream):
        return "PDF parsing library not available"

try:
    from docx import Document
    def extract_docx_text(file_stream):
        doc = Document(file_stream)
        return "\n".join([p.text for p in doc.paragraphs])
except ImportError:
    def extract_docx_text(file_stream):
        return "DOCX parsing library not available"

# ============================
# FastAPI app
# ============================
app = FastAPI(title="Interview Assistant API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ replace "*" with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# Groq client
# ============================
if not GROQ_API_KEY:
    raise RuntimeError("❌ GROQ_API_KEY not configured in Railway variables")

client = Groq(api_key=GROQ_API_KEY)

# ============================
# Models
# ============================
class QuestionRequest(BaseModel):
    role: str = DEFAULT_ROLE
    counts: Dict[str, int] = DEFAULT_COUNTS
    seed: Optional[int] = DEFAULT_SEED

class QuestionResponse(BaseModel):
    id: int
    difficulty: str
    question: str
    timeLimit: int

class ScoreRequest(BaseModel):
    question: str
    difficulty: str
    answer: str

class ScoreResponse(BaseModel):
    score: int
    feedback: str

class QAItem(BaseModel):
    question: str
    answer: str
    difficulty: str
    score: Optional[int] = None

class CandidateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class FinalizeRequest(BaseModel):
    items: List[QAItem]
    profile: CandidateProfile

class FinalizeResponse(BaseModel):
    finalScore: int
    summary: str

class ResumeParseResponse(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    rawText: str

# ============================
# Utility: Call Groq
# ============================
async def call_groq(messages: List[Dict], model="llama-3.1-70b-versatile", max_tokens=500, temperature=0.3):
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API error: {e}")
        return f"Error: {e}"

# ============================
# API Endpoints
# ============================
@app.get("/")
async def root():
    return {"message": "Interview Assistant API is running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_configured": bool(GROQ_API_KEY),
    }

@app.post("/test-groq")
async def test_groq():
    if not GROQ_API_KEY:
        return {"status": "error", "message": "No GROQ_API_KEY configured"}
    resp = await call_groq([{"role": "user", "content": "Say 'Groq connection OK'"}], max_tokens=5)
    return {"status": "ok" if "OK" in resp else "error", "response": resp}

@app.post("/parse-resume", response_model=ResumeParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    text = ""
    if file.filename.endswith(".pdf"):
        text = extract_pdf_text(BytesIO(contents))
    elif file.filename.endswith(".docx"):
        text = extract_docx_text(BytesIO(contents))

    text = text[:MAX_TEXT_LENGTH]

    # Extract basic info
    name = re.search(r"([A-Z][a-z]+\s[A-Z][a-z]+)", text)
    email = re.search(r"[\w\.-]+@[\w\.-]+", text)
    phone = re.search(r"\+?\d[\d\s-]{8,}", text)

    return {
        "name": name.group(0) if name else None,
        "email": email.group(0) if email else None,
        "phone": phone.group(0) if phone else None,
        "rawText": text
    }

@app.post("/generate-questions", response_model=List[QuestionResponse])
async def generate_questions(req: QuestionRequest):
    random.seed(req.seed or DEFAULT_SEED)
    messages = [
        {"role": "system", "content": f"Generate {sum(req.counts.values())} technical interview questions for a {req.role} role. Separate them by difficulty: easy, medium, hard."}
    ]
    resp = await call_groq(messages, max_tokens=800)
    questions = []
    qid = 1
    for difficulty in ["easy", "medium", "hard"]:
        for i in range(req.counts.get(difficulty, 0)):
            questions.append({
                "id": qid,
                "difficulty": difficulty,
                "question": f"{difficulty.capitalize()} Q{qid}: {resp}",
                "timeLimit": 120 if difficulty == "hard" else 60
            })
            qid += 1
    return questions

@app.post("/score-answer", response_model=ScoreResponse)
async def score_answer(req: ScoreRequest):
    messages = [
        {"role": "system", "content": "You are an interviewer. Score answers from 1 to 10 and provide feedback."},
        {"role": "user", "content": f"Question: {req.question}\nAnswer: {req.answer}"}
    ]
    resp = await call_groq(messages, max_tokens=200)
    score = random.randint(1, 10)  # Simplified scoring
    return {"score": score, "feedback": resp}

@app.post("/finalize", response_model=FinalizeResponse)
async def finalize(req: FinalizeRequest):
    total_score = 0
    count = 0
    for item in req.items:
        if item.score is not None:
            weight = DIFFICULTY_WEIGHTS.get(item.difficulty, 1.0)
            total_score += item.score * weight
            count += weight
    final_score = int(total_score / count) if count > 0 else 0

    summary_messages = [
        {"role": "system", "content": "Summarize candidate performance in 5 sentences."},
        {"role": "user", "content": f"Candidate: {req.profile.name}, Email: {req.profile.email}, Phone: {req.profile.phone}\nQA: {req.items}"}
    ]
    summary = await call_groq(summary_messages, max_tokens=300)

    return {"finalScore": final_score, "summary": summary}

# ============================
# Entry point
# ============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
