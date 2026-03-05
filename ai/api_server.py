import os
import logging
from fastapi import FastAPI, Form, BackgroundTasks
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
    background_tasks: BackgroundTasks,
    sender: str = Form(..., alias="from"),
    to: str = Form(...),
    text: str = Form(...),
):
    """
    Receives an inbound SMS from AfricasTalking when a user texts shortcode 90415.
    - `to`     : the shortcode (90415) the user texted
    - `sender` : the user's phone number we reply to
    - `text`   : the message body
    The Jali AI agent generates an LLM response and sends it back as SMS.
    """
    logger.info(f"[INBOUND SMS] Shortcode={to} | From={sender} | Message='{text}'")

    # Run the slow LLM + SMS reply in the background so AT gets an instant 200 OK
    background_tasks.add_task(_reply_to_user, sender, text)

    # Return immediately — AfricasTalking requires a fast response or it retries
    return ""


def _reply_to_user(sender: str, text: str):
    """Background task: generate LLM reply and send SMS back to the user."""
    user_id = sender.replace("+", "").replace(" ", "")
    try:
        reply = llm_service.generate_reply(text, user_id)
        logger.info(f"[AGENT REPLY] To {sender}: {reply}")
        alert_manager.send_to_number(sender, reply)
    except Exception as e:
        logger.error(f"[REPLY ERROR] Failed to reply to {sender}: {e}")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}
