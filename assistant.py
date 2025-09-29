from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import re
import random
from io import BytesIO
import openai
import os
from datetime import datetime
from constants import OPENAI_API_KEY, APP_HOST, APP_PORT

# Import resume parsing utilities
try:
    import pdfminer.six.extract_text as extract_pdf_text
except ImportError:
    try:
        import pypdf
        def extract_pdf_text(file_stream):
            reader = pypdf.PdfReader(file_stream)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
    except ImportError:
        def extract_pdf_text(file_stream):
            return "PDF parsing library not available"

try:
    from docx import Document
    def extract_docx_text(file_stream):
        doc = Document(file_stream)
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
except ImportError:
    def extract_docx_text(file_stream):
        return "DOCX parsing library not available"

app = FastAPI(title="Interview Assistant API", version="1.0.0")

# Initialize OpenAI client
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)
if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-api-key-here":
    print("Warning: OPENAI_API_KEY not configured in constants.py")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QuestionRequest(BaseModel):
    role: str = "fullstack"
    counts: Dict[str, int] = {"easy": 2, "medium": 2, "hard": 2}
    seed: Optional[int] = 42

class Question(BaseModel):
    id: int
    difficulty: str
    question: str
    expectedKeywords: List[str]
    timeLimit: int

class ScoreRequest(BaseModel):
    question: str
    difficulty: str
    answer: str

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

class ResumeParseResponse(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    rawText: str

class QuestionResponse(BaseModel):
    id: int
    difficulty: str
    question: str
    timeLimit: int

class ScoreResponse(BaseModel):
    score: int
    feedback: str

class FinalizeResponse(BaseModel):
    finalScore: int
    summary: str

# OpenAI utility functions
async def call_openai(messages: List[Dict], model: str = "gpt-3.5-turbo", max_tokens: int = 1000, temperature: float = 0.3):
    """Make OpenAI API call with error handling"""
    try:
        if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-api-key-here":
            # Fallback to mock response when API key is not available
            return "OpenAI API key not configured. Using fallback response."
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        return f"Error: {str(e)}"

async def extract_resume_fields_with_ai(raw_text: str) -> Dict[str, Optional[str]]:
    """Use OpenAI to extract name, email, and phone from resume text"""
    
    prompt = f"""
    Extract the candidate's name, email address, and phone number from the following resume text.
    Return the result as a JSON object with keys: "name", "email", "phone".
    If any field is not found or unclear, set it to null.
    
    Resume text:
    {raw_text[:3000]}  # Limit text to avoid token limits
    
    Return only the JSON object, no additional text:
    """
    
    messages = [
        {"role": "system", "content": "You are an expert at extracting contact information from resumes. Always respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_openai(messages, temperature=0.1)
        
        # Try to parse JSON response
        if response.startswith("Error:"):
            # Fallback to regex-based extraction
            return {
                "name": extract_name_fallback(raw_text),
                "email": extract_email_fallback(raw_text),
                "phone": extract_phone_fallback(raw_text)
            }
        
        # Clean response and parse JSON
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:-3].strip()
        elif response.startswith("```"):
            response = response[3:-3].strip()
            
        result = json.loads(response)
        return result
        
    except Exception as e:
        print(f"AI extraction failed: {str(e)}")
        # Fallback to regex-based extraction
        return {
            "name": extract_name_fallback(raw_text),
            "email": extract_email_fallback(raw_text),
            "phone": extract_phone_fallback(raw_text)
        }

def extract_name_fallback(text: str) -> Optional[str]:
    """Fallback name extraction using heuristics"""
    lines = text.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        if not line:
            continue
        skip_words = ['resume', 'cv', 'curriculum vitae', 'profile', 'summary']
        if any(word in line.lower() for word in skip_words):
            continue
        words = line.split()
        if 2 <= len(words) <= 4 and all(word[0].isupper() for word in words if word.isalpha()):
            return line
    return None

def extract_email_fallback(text: str) -> Optional[str]:
    """Fallback email extraction using regex"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    matches = re.findall(email_pattern, text)
    return matches[0] if matches else None

def extract_phone_fallback(text: str) -> Optional[str]:
    """Fallback phone extraction using regex"""
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{10}',
    ]
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
    return None

async def generate_questions_with_ai(role: str, counts: Dict[str, int], seed: int) -> List[QuestionResponse]:
    """Generate interview questions using OpenAI"""
    
    total_questions = sum(counts.values())
    easy_count = counts.get("easy", 0)
    medium_count = counts.get("medium", 0)
    hard_count = counts.get("hard", 0)
    
    prompt = f"""
    Generate {total_questions} technical interview questions for a {role} developer role.
    
    Requirements:
    - {easy_count} Easy questions (20 seconds each): Basic concepts, definitions
    - {medium_count} Medium questions (60 seconds each): Implementation, problem-solving
    - {hard_count} Hard questions (120 seconds each): System design, optimization, architecture
    
    Focus areas for fullstack role:
    - React.js (hooks, state management, performance)
    - Node.js (event loop, APIs, middleware)
    - JavaScript (ES6+, async/await, closures)
    - Database design and optimization
    - System architecture and scaling
    
    Return as JSON array with this structure:
    [
        {{
            "id": 1,
            "difficulty": "easy|medium|hard",
            "question": "Your question here",
            "timeLimit": 20|60|120
        }}
    ]
    
    Make questions practical and relevant to real-world development scenarios.
    """
    
    messages = [
        {"role": "system", "content": "You are an expert technical interviewer. Generate challenging but fair questions that test practical development skills."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        # Set seed for reproducibility
        random.seed(seed)
        
        response = await call_openai(messages, temperature=0.7, max_tokens=2000)
        
        if response.startswith("Error:"):
            # Fallback to predefined questions
            return get_fallback_questions(counts)
        
        # Clean and parse JSON response
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:-3].strip()
        elif response.startswith("```"):
            response = response[3:-3].strip()
            
        questions_data = json.loads(response)
        
        # Convert to QuestionResponse objects
        questions = []
        for i, q in enumerate(questions_data):
            questions.append(QuestionResponse(
                id=i + 1,
                difficulty=q.get("difficulty", "medium"),
                question=q.get("question", ""),
                timeLimit=q.get("timeLimit", 60)
            ))
        
        return questions
        
    except Exception as e:
        print(f"AI question generation failed: {str(e)}")
        return get_fallback_questions(counts)

def get_fallback_questions(counts: Dict[str, int]) -> List[QuestionResponse]:
    """Fallback questions when AI generation fails"""
    fallback_questions = {
        "easy": [
            {"question": "What is the difference between React state and props?", "timeLimit": 20},
            {"question": "Explain the Node.js event loop in simple terms.", "timeLimit": 20},
            {"question": "What are React hooks and why are they useful?", "timeLimit": 20},
        ],
        "medium": [
            {"question": "How would you implement debounced search in React?", "timeLimit": 60},
            {"question": "Explain JWT authentication flow in Node.js/Express.", "timeLimit": 60},
            {"question": "How do you handle form validation in React?", "timeLimit": 60},
        ],
        "hard": [
            {"question": "Design a scalable file upload system with chunked uploads.", "timeLimit": 120},
            {"question": "Optimize a React app for large tables (10k+ rows).", "timeLimit": 120},
            {"question": "Design a real-time chat application architecture.", "timeLimit": 120},
        ]
    }
    
    questions = []
    question_id = 1
    
    for difficulty, count in counts.items():
        available = fallback_questions.get(difficulty, [])
        selected = available[:count] if len(available) >= count else available
        
        for q in selected:
            questions.append(QuestionResponse(
                id=question_id,
                difficulty=difficulty,
                question=q["question"],
                timeLimit=q["timeLimit"]
            ))
            question_id += 1
    
    return questions

async def score_answer_with_ai(question: str, difficulty: str, answer: str) -> ScoreResponse:
    """Score answer using OpenAI"""
    
    if not answer or answer.strip() == "":
        return ScoreResponse(score=0, feedback="No answer provided.")
    
    # Define scoring criteria based on difficulty
    criteria = {
        "easy": "Focus on correctness and basic understanding. Score 0-10.",
        "medium": "Evaluate technical accuracy, implementation approach, and understanding of concepts. Score 0-10.",
        "hard": "Assess system thinking, scalability considerations, trade-offs, and depth of knowledge. Score 0-10."
    }
    
    prompt = f"""
    Analyze this technical interview answer and provide detailed feedback based on the answer content.
    
    Question: {question}
    Difficulty: {difficulty}
    Answer: {answer}
    
    Analysis Criteria for {difficulty} questions:
    {criteria[difficulty]}
    
    Please analyze the answer content and provide:
    1. What the candidate got right or demonstrated well
    2. What technical concepts they understood correctly
    3. What could be improved or was missing
    4. Specific technical areas they could elaborate on
    5. Overall assessment of their understanding
    
    Also provide a score (0-10) based on:
    - Technical correctness (0-4 points)
    - Depth and understanding (0-3 points)  
    - Clarity and structure (0-2 points)
    - Practical considerations (0-1 points)
    
    Return response as JSON:
    {{
        "score": <number 0-10>,
        "feedback": "<detailed analysis of the answer content, what they understood well, what could be improved, and specific technical feedback>"
    }}
    """
    
    messages = [
        {"role": "system", "content": "You are an expert technical interviewer. Analyze the candidate's answer content thoroughly and provide detailed feedback based on what they actually said, their technical understanding, and specific areas for improvement. Focus on the substance of their answer rather than just scoring."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = await call_openai(messages, temperature=0.3)
        
        if response.startswith("Error:"):
            # Fallback scoring with answer-based analysis
            word_count = len(answer.split())
            score = min(word_count // 5, 7)  # Basic word count scoring
            
            # Generate basic answer-based feedback
            if word_count < 10:
                feedback = f"Your answer is quite brief ({word_count} words). Consider elaborating on the technical concepts and providing specific examples to demonstrate your understanding."
            elif word_count < 25:
                feedback = f"You provided a moderate response ({word_count} words). The answer shows some understanding, but could benefit from more technical depth and concrete examples."
            else:
                feedback = f"You provided a detailed response ({word_count} words). Consider focusing on the most relevant technical aspects and ensuring clarity in your explanations."
            
            return ScoreResponse(
                score=score,
                feedback=feedback
            )
        
        # Clean and parse JSON
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:-3].strip()
        elif response.startswith("```"):
            response = response[3:-3].strip()
            
        result = json.loads(response)
        
        return ScoreResponse(
            score=max(0, min(10, result.get("score", 5))),  # Ensure score is 0-10
            feedback=result.get("feedback", "Answer evaluated.")
        )
        
    except Exception as e:
        print(f"AI scoring failed: {str(e)}")
        # Fallback scoring based on answer length and basic keywords
        word_count = len(answer.split())
        score = min(word_count // 10, 6) if word_count > 5 else 2
        
        # Generate answer-based fallback feedback
        if word_count < 5:
            feedback = "Your answer is very brief. Consider providing more detailed explanations of the technical concepts to better demonstrate your understanding."
        elif word_count < 15:
            feedback = "You provided a short answer. Try to elaborate on the technical aspects and include specific examples or use cases to strengthen your response."
        else:
            feedback = "You provided a substantial answer. Focus on ensuring your technical explanations are accurate and well-structured to maximize the impact of your response."
        
        return ScoreResponse(
            score=score,
            feedback=feedback
        )

async def generate_final_summary_with_ai(items: List[QAItem], profile: CandidateProfile) -> FinalizeResponse:
    """Generate final score and summary using OpenAI"""
    
    # Calculate weighted score
    difficulty_weights = {"easy": 1.0, "medium": 1.75, "hard": 2.25}
    total_weighted_score = 0
    total_weight = 0
    
    qa_summary = []
    for item in items:
        weight = difficulty_weights.get(item.difficulty, 1.0)
        score = item.score or 0
        total_weighted_score += score * weight
        total_weight += weight
        
        qa_summary.append({
            "question": item.question[:100] + "..." if len(item.question) > 100 else item.question,
            "difficulty": item.difficulty,
            "score": score,
            "answer_length": len(item.answer.split()) if item.answer else 0
        })
    
    # Normalize to 0-100
    final_score = int((total_weighted_score / total_weight) * 10) if total_weight > 0 else 0
    final_score = max(0, min(100, final_score))
    
    # Generate summary with AI
    prompt = f"""
    Generate a concise interview summary for this candidate:
    
    Candidate: {profile.name or 'Unknown'}
    Final Score: {final_score}/100
    
    Question Performance:
    {json.dumps(qa_summary, indent=2)}
    
    Provide a 2-3 sentence summary covering:
    - Key strengths demonstrated
    - Areas for improvement
    - Overall assessment
    
    Keep it professional and constructive.
    """
    
    messages = [
        {"role": "system", "content": "You are an HR expert writing candidate interview summaries. Be concise and professional."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        summary = await call_openai(messages, temperature=0.5, max_tokens=300)
        
        if summary.startswith("Error:"):
            # Fallback summary
            summary = f"Candidate completed {len(items)} questions with an overall score of {final_score}/100. Performance varied across different difficulty levels."
        
        return FinalizeResponse(
            finalScore=final_score,
            summary=summary
        )
        
    except Exception as e:
        print(f"AI summary generation failed: {str(e)}")
        return FinalizeResponse(
            finalScore=final_score,
            summary=f"Technical interview completed with {len(items)} questions answered. Overall performance: {final_score}/100."
        )

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Interview Assistant API with OpenAI integration is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "openai_configured": bool(OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-api-key-here")
    }

@app.post("/parse-resume", response_model=ResumeParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    """Extract candidate information from uploaded resume using AI"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file extension
        file_extension = file.filename.lower().split('.')[-1]
        if file_extension not in ['pdf', 'docx']:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        # Read file content
        file_content = await file.read()
        file_stream = BytesIO(file_content)
        
        # Extract text based on file type
        if file_extension == 'pdf':
            raw_text = extract_pdf_text(file_stream)
        elif file_extension == 'docx':
            raw_text = extract_docx_text(file_stream)
        
        if not raw_text or len(raw_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from file")
        
        # Use AI to extract fields
        extracted_fields = await extract_resume_fields_with_ai(raw_text)
        
        return ResumeParseResponse(
            name=extracted_fields.get("name"),
            email=extracted_fields.get("email"),
            phone=extracted_fields.get("phone"),
            rawText=raw_text[:5000]  # Limit raw text length
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@app.post("/generate-questions")
async def generate_questions(request: QuestionRequest) -> List[QuestionResponse]:
    """Generate interview questions using AI"""
    try:
        questions = await generate_questions_with_ai(request.role, request.counts, request.seed or 42)
        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@app.post("/score-answer", response_model=ScoreResponse)
async def score_answer(request: ScoreRequest):
    """Score an answer using AI"""
    try:
        result = await score_answer_with_ai(request.question, request.difficulty, request.answer)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scoring answer: {str(e)}")

@app.post("/finalize", response_model=FinalizeResponse)
async def finalize_interview(request: FinalizeRequest):
    """Generate final score and summary using AI"""
    try:
        result = await generate_final_summary_with_ai(request.items, request.profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finalizing interview: {str(e)}")

# Additional utility endpoints

@app.post("/test-openai")
async def test_openai_connection():
    """Test OpenAI API connection"""
    try:
        if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-api-key-here":
            return {"status": "error", "message": "OpenAI API key not configured"}
        
        response = await call_openai([
            {"role": "user", "content": "Respond with 'OpenAI connection successful'"}
        ], max_tokens=10)
        
        return {
            "status": "success" if "successful" in response else "error",
            "response": response
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=APP_HOST, port=APP_PORT)
