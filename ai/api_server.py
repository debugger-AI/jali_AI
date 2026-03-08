import os
import logging
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from ai.voice_service import SwahiliVoiceService, CommonVoiceDownloader
from ai.chat_service import JaliChatService
from ai.rag_pipeline import JaliVectorStore, build_index

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Jali AI Agent Server")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
voice_service = SwahiliVoiceService()
chat_service = JaliChatService()

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    store = JaliVectorStore()
    try:
        doc_count = store.count
    except Exception:
        doc_count = 0
    return {
        "status": "ok",
        "services": ["voice", "llm", "rag"],
        "rag_documents": doc_count,
    }

# ---------------------------------------------------------------------------
# RAG management
# ---------------------------------------------------------------------------
@app.post("/api/rag/build")
async def build_rag_index():
    """Ingest all PDFs from RAG data/ into the vector store."""
    try:
        count = build_index()
        return {"status": "ok", "chunks_indexed": count}
    except Exception as e:
        logger.error(f"RAG build failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/rag/search")
async def rag_search(q: str, n: int = 5):
    """Search the RAG vector store."""
    try:
        store = JaliVectorStore()
        results = store.search(q, n_results=n)
        return {"results": results}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# ---------------------------------------------------------------------------
# Text Chat (RAG-powered, with history)
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

@app.post("/api/chat")
async def text_chat(req: ChatRequest):
    """RAG-powered text chat with conversation history."""
    try:
        result = chat_service.chat(req.message, session_id=req.session_id)
        return result
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/chat/clear")
async def clear_chat(session_id: str = "default"):
    """Clear conversation history for a session."""
    chat_service.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}

# ---------------------------------------------------------------------------
# Voice endpoints
# ---------------------------------------------------------------------------
@app.post("/api/voice/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe Swahili audio to text using Whisper."""
    try:
        audio_data = await audio.read()
        transcript = voice_service.transcribe_audio(audio_data, audio.filename or "audio.webm")
        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/voice/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    user_id: str = Form(default="anonymous"),
    session_id: str = Form(default="voice_default"),
):
    """
    Voice chat: audio -> transcribe -> RAG chat -> TTS -> audio out.
    Uses the same RAG-powered chat service as text chat.
    """
    try:
        audio_data = await audio.read()

        # Step 1: Transcribe
        transcript = voice_service.transcribe_audio(audio_data, audio.filename or "audio.webm")

        # Step 2: RAG-powered chat (with history)
        chat_result = chat_service.chat(transcript, session_id=session_id)
        response_text = chat_result["response"]

        # Step 3: TTS
        response_audio = None
        try:
            audio_bytes = voice_service.text_to_speech(response_text)
            response_audio = base64.b64encode(audio_bytes).decode("utf-8")
        except Exception:
            logger.warning("TTS failed, returning text only")

        return {
            "transcript": transcript,
            "response_text": response_text,
            "response_audio": response_audio,
            "has_context": chat_result.get("has_context", False),
        }
    except Exception as e:
        logger.error(f"Voice chat failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/voice/tts")
async def text_to_speech(text: str = Form(...)):
    """Convert text to speech (Swahili or English)."""
    try:
        audio_bytes = voice_service.text_to_speech(text)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio": audio_b64}
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# ---------------------------------------------------------------------------
# Common Voice dataset
# ---------------------------------------------------------------------------
@app.post("/api/voice/download-dataset")
async def download_common_voice():
    """Get download URL for Mozilla Common Voice Swahili dataset."""
    try:
        downloader = CommonVoiceDownloader()
        url = downloader.get_download_url()
        return {"download_url": url}
    except Exception as e:
        logger.error(f"Dataset download failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
