"""
llm_service.py
Jali LLM Service — generates personalised alert messages and SMS replies.
Backend: Groq (openai/gpt-oss-120b)
"""

import os
import json
import logging
from dotenv import load_dotenv

import mlflow
from groq import Groq

load_dotenv()

# ---------------------------------------------------------------------------
# MLflow
# ---------------------------------------------------------------------------
mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db"))
mlflow.set_experiment("Jali_AI_Agents")

# ---------------------------------------------------------------------------
# Groq client
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY is not set. Add it to your .env file.")

groq_client = Groq(api_key=GROQ_API_KEY)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------
def _chat(messages: list) -> str:
    """Call Groq and return the assistant's reply."""
    resp = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
    )
    return resp.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------
class LLMService:
    def __init__(self):
        logger.info(f"LLMService ready — Groq model: {GROQ_MODEL}")

    def generate_alert_message(self, context: dict) -> str:
        """
        Takes prediction event data and generates a personalised notification.
        """
        system_prompt = (
            "You are a helpful and empathetic AI Agent for the Jali Health platform. "
            "Generate a personalised notification for a user based on their health context. "
            "Keep the message concise, empathetic, and friendly. "
            "Do not use complex medical jargon."
        )
        user_prompt = (
            f"Please generate a notification based on the following context:\n"
            f"{json.dumps(context, indent=2)}"
        )

        try:
            with mlflow.start_run(run_name="generate_alert"):
                mlflow.log_params({"context_type": context.get("type", "unknown"),
                                   "model": GROQ_MODEL})
                return _chat([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ])
        except Exception as e:
            logger.error(f"Error generating alert message: {e}")
            return (
                "Jali Health Reminder: You have an important health update. "
                "Please check your Jali dashboard for more details."
            )

    def generate_reply(self, incoming_message: str, user_id: str) -> str:
        """
        Handles an inbound SMS and generates an appropriate response.
        """
        system_prompt = (
            "You are a helpful and empathetic AI Agent for the Jali Health platform. "
            "A user has replied to one of your notifications. Respond appropriately — "
            "be concise, supportive, and direct them to a clinic or the Jali app "
            "for detailed medical questions."
        )

        try:
            with mlflow.start_run(run_name="generate_reply"):
                mlflow.log_params({"user_id": user_id, "model": GROQ_MODEL})
                return _chat([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": incoming_message},
                ])
        except Exception as e:
            logger.error(f"Error generating reply: {e}")
            return (
                "Thank you for reaching out to Jali. "
                "A health worker will review your message soon."
            )
