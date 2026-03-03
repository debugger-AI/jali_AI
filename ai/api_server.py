import os
import logging
from fastapi import FastAPI, Form, Request, Response
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv

import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from ai.llm_service import LLMService
from notifications.alert_manager import AlertManager

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Jali AI Agent Server")
llm_service = LLMService()
alert_manager = AlertManager()


# ---------------------------------------------------------------------------
# AfricasTalking Inbound SMS Webhook
# AT sends a POST with form fields: from, to, text, date, id
# ---------------------------------------------------------------------------
@app.post("/webhook/sms/inbound", response_class=PlainTextResponse)
async def handle_inbound_sms(
    sender: str = Form(..., alias="from"),
    to: str = Form(...),
    text: str = Form(...),
):
    """
    Receives an inbound SMS from AfricasTalking when a user replies to
    a Jali agent message. The Jali AI agent generates an LLM response
    and immediately sends it back as a real SMS.
    """
    logger.info(f"[INBOUND SMS] From {sender}: {text}")

    # Use sender phone as user_id for now (in production, resolve to real user_id)
    user_id = sender.replace("+", "").replace(" ", "")

    # Generate a real-time LLM reply
    reply = llm_service.generate_reply(text, user_id)
    logger.info(f"[AGENT REPLY] To {sender}: {reply}")

    # Send the SMS reply back immediately using AfricasTalking
    alert_manager.send_to_number(sender, reply)

    # Respond with empty 200 OK so AfricasTalking doesn't retry
    return ""


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}
