"""
Jali Chat Service
- RAG-powered conversational AI
- Bilingual: Swahili + English
- Connects to remote Colab LLM via Ngrok or falls back to OpenAI
- Maintains conversation history per session
"""

import os
import json
import logging
import requests
from typing import List, Optional, Dict
from dotenv import load_dotenv
from openai import OpenAI

from ai.rag_pipeline import JaliVectorStore

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LLM Configuration
# ---------------------------------------------------------------------------
NGROK_LLM_URL = os.environ.get("NGROK_LLM_URL", "")

if NGROK_LLM_URL:
    # Trick the OpenAI client into talking to our remote Ollama server
    main_client = OpenAI(base_url=f"{NGROK_LLM_URL}/v1", api_key="ollama")
    MAIN_MODEL = "llama3.1:8b" # Used in colab notebook
else:
    main_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    MAIN_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

SYSTEM_PROMPT = """You are Jali, a bilingual (Swahili/English) AI health assistant for social workers in Kenya.

You help Community Health Volunteers (CHVs) and Case Managers with:
- HIV adherence tracking and patient follow-ups
- TB treatment monitoring and DOTs support
- Immunization schedules for children
- Family planning guidance
- Gender-based violence (GBV) support and referrals
- Maternal and child nutrition

Rules:
1. If the user writes in Swahili, respond in Swahili. If English, respond in English.
2. Use the provided CONTEXT to give accurate, evidence-based answers.
3. If context is provided, cite the source document when relevant.
4. Be concise, empathetic, and culturally appropriate for Kenya.
5. For serious medical decisions, always advise consulting a doctor or clinic.
6. Never fabricate medical information. Say "sijui" (I don't know) if unsure.
7. Keep responses under 150 words unless the user asks for detail."""


class JaliChatService:
    """RAG-powered chat with conversation memory and bilingual support."""

    def __init__(self):
        self.vector_store = JaliVectorStore()
        self.conversations: Dict[str, List[dict]] = {}  # session_id -> messages
        self.use_ngrok = bool(NGROK_LLM_URL)

        if self.use_ngrok:
            logger.info(f"Using remote Colab model via Ngrok: {MAIN_MODEL} at {NGROK_LLM_URL}")
        else:
            logger.info(f"Using OpenAI fallback model: {MAIN_MODEL}")

    def _get_history(self, session_id: str) -> List[dict]:
        """Get or create conversation history."""
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        return self.conversations[session_id]

    def _retrieve_context(self, query: str) -> str:
        """Search RAG store for relevant context."""
        try:
            results = self.vector_store.search(query, n_results=4)
            if not results:
                return ""

            context_parts = []
            for r in results:
                src = r["metadata"].get("source", "unknown")
                page = r["metadata"].get("page", "?")
                context_parts.append(f"[{src}, p.{page}]\n{r['text']}")

            return "\n\n---\n\n".join(context_parts)
        except Exception as e:
            logger.warning(f"RAG search failed: {e}")
            return ""

    def chat(self, user_message: str, session_id: str = "default") -> dict:
        """
        Process a chat message:
        1. Retrieve RAG context
        2. Build message history
        3. Call LLM
        4. Store in history
        """
        history = self._get_history(session_id)

        # RAG retrieval
        context = self._retrieve_context(user_message)

        # Build system message with context
        system_content = SYSTEM_PROMPT
        if context:
            system_content += f"\n\nCONTEXT from Jali health documents:\n{context}"

        # Build messages: system + last 10 turns + new message
        messages = [{"role": "system", "content": system_content}]
        messages.extend(history[-10:])  # Keep last 10 messages for context
        messages.append({"role": "user", "content": user_message})

        # Call LLM
        try:
            response = main_client.chat.completions.create(
                model=MAIN_MODEL,
                messages=messages,
                max_tokens=600,
                temperature=0.7,
            )
            response_text = response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            # Try free tier public unauthenticated HF as last resort
            try:
                logger.info("Attempting unauthenticated free HF endpoint fallback...")
                api_url = "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct"
                prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages]) + "\nassistant: "
                
                resp = requests.post(
                    api_url, 
                    headers={"Content-Type": "application/json"}, 
                    json={"inputs": prompt[-2000:], "parameters": {"max_new_tokens": 150}},
                    timeout=15
                )
                resp.raise_for_status()
                result = resp.json()
                response_text = result[0]["generated_text"].split("assistant: ")[-1].strip()
                logger.info("Public HF fallback succeeded!")
            except Exception as e3:
                logger.error(f"Public HF also failed: {e3}")
                response_text = (
                    "Samahani, kuna tatizo la muda kwenye mtandao. Tafadhali hakikisha Colab yako ipo online."
                    if any(c in user_message.lower() for c in ["habari", "saidia", "nataka", "tafadhali", "jambo"])
                    else "Sorry, the AI server is offline. Please make sure your Colab notebook is running."
                )

        # Store in conversation history
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": response_text})

        # Trim history to 20 messages
        if len(history) > 20:
            self.conversations[session_id] = history[-20:]

        return {
            "response": response_text,
            "has_context": bool(context),
            "session_id": session_id,
        }

    def clear_session(self, session_id: str):
        """Clear conversation history for a session."""
        self.conversations.pop(session_id, None)
