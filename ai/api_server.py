import os
import logging
from fastapi import FastAPI
from dotenv import load_dotenv

import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# from ai.llm_service import LLMService
# from notifications.alert_manager import AlertManager

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Jali AI Agent Server")

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}
