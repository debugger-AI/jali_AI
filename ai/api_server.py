import os
import logging
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from ai.voice_service import SwahiliVoiceService, CommonVoiceDownloader

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

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "services": ["voice", "llm"]}

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
    user_id: str = Form(default="anonymous")
):
    """
    Full voice chat: audio in -> transcribe -> LLM -> TTS -> audio out.
    Returns transcript, response text, and base64-encoded audio.
    """
    try:
        audio_data = await audio.read()
        result = voice_service.voice_chat(
            audio_data,
            filename=audio.filename or "audio.webm",
            user_id=user_id
        )

        response = {
            "transcript": result["transcript"],
            "response_text": result["response_text"],
        }

        # Encode audio as base64 for JSON transport
        if result["response_audio"]:
            response["response_audio"] = base64.b64encode(result["response_audio"]).decode("utf-8")

        return response
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
# Common Voice dataset management
# ---------------------------------------------------------------------------
@app.post("/api/voice/download-dataset")
async def download_common_voice():
    """Trigger download of the Mozilla Common Voice Swahili dataset."""
    try:
        downloader = CommonVoiceDownloader()
        url = downloader.get_download_url()
        return {"download_url": url, "message": "Use this URL to download the dataset."}
    except Exception as e:
        logger.error(f"Dataset download failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
