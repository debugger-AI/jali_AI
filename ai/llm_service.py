import os
import json
import logging
from typing import Optional
from dotenv import load_dotenv

import mlflow
import mlflow.openai
from openai import OpenAI

load_dotenv()

# Configure MLflow
mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "sqlite:///mlruns.db"))
mlflow.set_experiment("Jali_AI_Agents")

# We will enable autologging for OpenAI
mlflow.openai.autolog()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class LLMService:
    def __init__(self):
        # We can also handle specific prompts and context here
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4o")

    def generate_alert_message(self, context: dict) -> str:
        """
        Takes prediction event data and generates a personalized message.
        """
        system_prompt = (
            "You are a helpful and empathetic AI Agent for the Jali Health platform. "
            "Your job is to generate a personalized notification for a user based on their context. "
            "Keep the message concise, empathetic, and friendly. Do not use complex medical jargon."
        )

        user_prompt = f"Please generate a message based on the following context:\n{json.dumps(context, indent=2)}"

        try:
            with mlflow.start_run(run_name="generate_alert"):
                mlflow.log_params({"context_type": context.get("type", "unknown")})
                
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=150,
                    temperature=0.7
                )
                
                message = response.choices[0].message.content.strip()
                return message
        except Exception as e:
            logger.error(f"Error generating alert message: {e}")
            return "Jali Health Reminder: You have an important health update. Please check your Jali dashboard for more details."

    def generate_reply(self, incoming_message: str, user_id: str) -> str:
        """
        Handles incoming messages from users (webhook) and generates an appropriate response.
        """
        system_prompt = (
            "You are a helpful and empathetic AI Agent for the Jali Health platform. "
            "A user has replied to one of your notifications. Generate an appropriate response. "
            "Be concise, supportive, and remind them to visit a clinic or use the Jali app if they have detailed medical questions."
        )

        try:
            with mlflow.start_run(run_name="generate_reply"):
                mlflow.log_param("user_id", user_id)
                response = client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": incoming_message}
                    ],
                    max_tokens=150,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generating reply: {e}")
            return "Thank you for reaching out to Jali. A health worker will review your message soon."
