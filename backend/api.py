import os
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── App setup ────────────────────────────────────────────────────
app = FastAPI()

# ── Security Headers Middleware ──────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"  # Prevents clickjacking attacks
    response.headers["X-Content-Type-Options"] = "nosniff"  # Prevents MIME-sniffing
    response.headers["X-XSS-Protection"] = "1; mode=block"  # Enables browser XSS filters
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── CORS — allows React frontend to talk to this backend ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load system prompt ───────────────────────────────────────────
with open("nayepankh_system_prompt.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

# ── Groq client ──────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Simple In-Memory Rate Limiting ───────────────────────────────
rate_limit_records = {}
RATE_LIMIT_WINDOW = 60  # Time window in seconds
MAX_REQUESTS_PER_WINDOW = 30  # Max requests per client per window

def is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    if client_ip not in rate_limit_records:
        rate_limit_records[client_ip] = []
    
    # Filter out timestamps older than the window
    rate_limit_records[client_ip] = [t for t in rate_limit_records[client_ip] if now - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_records[client_ip]) >= MAX_REQUESTS_PER_WINDOW:
        return True
    
    rate_limit_records[client_ip].append(now)
    return False

# ── Request/Response models ──────────────────────────────────────
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User query, max 1000 chars")
    history: list[dict] = Field(default=[], max_items=20, description="Conversation context logs, max 20 messages")

class ChatResponse(BaseModel):
    reply: str
    history: list[dict]

# ── Chat endpoint ────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, fastapi_req: Request):
    # Enforce Rate Limiting based on Client IP
    client_ip = fastapi_req.client.host if fastapi_req.client else "unknown"
    if is_rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many queries. Please wait a minute and try again.")

    # Build messages: system prompt + history + new message
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ] + request.history + [
        {"role": "user", "content": request.message}
    ]

    # Call Groq
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.7,
        max_tokens=1024,
    )

    reply = response.choices[0].message.content

    # Update history and send back to frontend
    updated_history = request.history + [
        {"role": "user", "content": request.message},
        {"role": "assistant", "content": reply}
    ]

    return ChatResponse(reply=reply, history=updated_history)

# ── Health check ─────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "Asha is running 💙"}