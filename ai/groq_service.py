"""
groq_service.py
Standalone Groq inference wrapper for Jali.
Model: openai/gpt-oss-120b via console.groq.com
"""

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Initialise client — GROQ_API_KEY must be set in .env
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


def get_completion(messages: list, model: str = MODEL) -> str:
    """
    Create a chat completion using Groq.

    Args:
        messages: List of {"role": ..., "content": ...} dicts.
        model: Groq model identifier.

    Returns:
        Assistant response text.
    """
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
    )
    return completion.choices[0].message.content


# Quick smoke-test — python -m ai.groq_service
if __name__ == "__main__":
    response = get_completion([
        {"role": "user", "content": "Explain why fast inference is critical for reasoning models"}
    ])
    print(response)
