"""
Jali Voice Service - Swahili Speech-to-Text & Text-to-Speech
Uses OpenAI Whisper for STT (supports Swahili natively) and
Mozilla Common Voice Swahili data for fine-tuning.
"""

import os
import io
import json
import logging
import tempfile
import requests
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI
from groq import Groq

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# OpenAI required for Whisper/TTS
try:
    openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy"))
except Exception:
    openai_client = None

# Groq required for LLM reasoning
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
try:
    groq_client = Groq(api_key=GROQ_API_KEY)
except Exception:
    groq_client = None


class SwahiliVoiceService:
    """
    Handles Swahili voice interactions:
    - Speech-to-Text (STT) via Whisper
    - Text-to-Speech (TTS) via OpenAI TTS
    - Voice-based LLM chat (speak -> transcribe -> LLM -> respond)
    """

    def __init__(self):
        self.model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
        self.whisper_model = "whisper-1"
        self.tts_model = "tts-1"
        self.tts_voice = "nova"  # warm, friendly voice

        self.system_prompt = (
            "You are Jali, a compassionate AI health assistant for social workers in Kenya. "
            "You speak fluent Swahili and English. When a user speaks in Swahili, respond in Swahili. "
            "When they speak in English, respond in English. "
            "You help Community Health Volunteers (CHVs) and Case Managers with:\n"
            "- HIV adherence tracking and patient follow-ups\n"
            "- TB treatment monitoring\n"
            "- Immunization schedules for children\n"
            "- Family planning guidance\n"
            "Keep responses concise, empathetic, and culturally appropriate. "
            "If asked about serious medical decisions, advise them to consult a doctor."
        )

    def transcribe_audio(self, audio_data: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribe audio to text using Whisper.
        Supports Swahili (sw) natively.
        """
        try:
            # Create a temporary file for the audio
            suffix = os.path.splitext(filename)[1] or ".webm"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            with open(tmp_path, "rb") as audio_file:
                if not openai_client:
                    raise Exception("OpenAI client missing for STT")
                transcript = openai_client.audio.transcriptions.create(
                    model=self.whisper_model,
                    file=audio_file,
                    language="sw",  # Swahili language code
                    response_format="text",
                    prompt="Hii ni mazungumzo kuhusu afya ya jamii nchini Kenya."  # Context hint
                )

            os.unlink(tmp_path)
            logger.info(f"Transcribed: {transcript[:100]}...")
            return transcript

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise

    def text_to_speech(self, text: str) -> bytes:
        """
        Convert text to speech using OpenAI TTS.
        Works well with Swahili text.
        """
        try:
            if not openai_client:
                raise Exception("OpenAI client missing for TTS")
            response = openai_client.audio.speech.create(
                model=self.tts_model,
                voice=self.tts_voice,
                input=text,
                response_format="mp3",
                speed=0.95  # Slightly slower for clarity
            )
            audio_bytes = response.content
            logger.info(f"Generated TTS for: {text[:60]}...")
            return audio_bytes

        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise

    def voice_chat(self, audio_data: bytes, filename: str = "audio.webm",
                   user_id: str = "unknown") -> dict:
        """
        Full voice chat pipeline:
        1. Transcribe Swahili audio to text
        2. Send to LLM for response
        3. Convert response to speech
        Returns dict with transcript, response text, and audio bytes.
        """
        # Step 1: Transcribe
        try:
            transcript = self.transcribe_audio(audio_data, filename)
        except Exception as e:
            logger.error(f"STT error: {e}")
            transcript = "Error capturing audio."

        # Step 2: LLM response
        try:
            llm_response = groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": transcript}
                ],
            )
            response_text = llm_response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"LLM error: {e}")
            response_text = "Samahani, kuna tatizo. Tafadhali jaribu tena baadaye."

        # Step 3: TTS
        try:
            response_audio = self.text_to_speech(response_text)
        except Exception:
            response_audio = None

        return {
            "transcript": transcript,
            "response_text": response_text,
            "response_audio": response_audio,
            "user_id": user_id
        }


class CommonVoiceDownloader:
    """
    Downloads the Mozilla Common Voice Swahili dataset
    for offline fine-tuning and evaluation.
    """

    BASE_URL = "https://datacollective.mozillafoundation.org/api"

    def __init__(self):
        self.api_key = os.environ.get("COMMON_VOICE_API_KEY")
        self.client_id = os.environ.get("COMMON_VOICE_CLIENT_ID")
        self.dataset_id = os.environ.get("COMMON_VOICE_DATASET_ID")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def get_download_url(self) -> str:
        """Get the dataset download URL from Mozilla API."""
        url = f"{self.BASE_URL}/datasets/{self.dataset_id}/download"
        logger.info(f"Requesting download URL for dataset {self.dataset_id}...")

        response = requests.post(url, headers=self.headers)
        response.raise_for_status()

        data = response.json()
        download_url = data.get("downloadUrl")

        if not download_url:
            raise ValueError(f"No download URL returned. Response: {data}")

        logger.info(f"Got download URL: {download_url[:80]}...")
        return download_url

    def download_dataset(self, output_dir: str = "data/common_voice_sw") -> str:
        """
        Download the Common Voice Swahili dataset.
        Returns the path to the downloaded file.
        """
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "common_voice_sw.tar.gz")

        if os.path.exists(output_path):
            logger.info(f"Dataset already downloaded: {output_path}")
            return output_path

        download_url = self.get_download_url()

        logger.info("Downloading Common Voice Swahili dataset (this may take a while)...")
        response = requests.get(download_url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    pct = (downloaded / total_size) * 100
                    if downloaded % (50 * 8192) == 0:
                        logger.info(f"  Download progress: {pct:.1f}%")

        logger.info(f"Download complete: {output_path} ({downloaded / 1024 / 1024:.1f} MB)")
        return output_path


# ---------------------------------------------------------------------------
# Quick test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=== Jali Swahili Voice Service ===")
    print()

    # Test STT + LLM (text mode for quick test)
    svc = SwahiliVoiceService()
    print("[LLM Test] Sending Swahili text to LLM...")
    try:
        response = groq_client.chat.completions.create(
            model=svc.model,
            messages=[
                {"role": "system", "content": svc.system_prompt},
                {"role": "user", "content": "Habari, nataka kujua kuhusu ratiba ya chanjo ya mtoto wangu."}
            ],
        )
        print(f"  Response: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"  Error: {e}")

    print()
    print("[Common Voice] Testing dataset download URL...")
    try:
        dl = CommonVoiceDownloader()
        url = dl.get_download_url()
        print(f"  Download URL: {url[:80]}...")
    except Exception as e:
        print(f"  Error: {e}")
