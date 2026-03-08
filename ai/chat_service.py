"""
Jali Chat Service
- RAG-powered conversational AI
- Bilingual: Swahili + English
- Uses HuggingFace Inference API for Swahili-capable model
- Falls back to OpenAI GPT-4o
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
# HuggingFace Inference API
# ---------------------------------------------------------------------------
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HF_MODEL = os.environ.get("HF_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}/v1/chat/completions"

# OpenAI fallback
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

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
7. Keep responses under 200 words unless the user asks for detail."""


class JaliChatService:
    """RAG-powered chat with conversation memory and bilingual support."""

    def __init__(self):
        self.vector_store = JaliVectorStore()
        self.conversations: Dict[str, List[dict]] = {}  # session_id -> messages
        self.use_hf = bool(HF_API_TOKEN)

        if self.use_hf:
            logger.info(f"Using HuggingFace model: {HF_MODEL}")
        else:
            logger.info(f"Using OpenAI model: {OPENAI_MODEL} (set HF_API_TOKEN for HuggingFace)")

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

    def _call_hf(self, messages: List[dict]) -> str:
        """Call HuggingFace Inference API."""
        headers = {
            "Authorization": f"Bearer {HF_API_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": HF_MODEL,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
        }

        resp = requests.post(HF_API_URL, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    def _call_openai(self, messages: List[dict]) -> str:
        """Call OpenAI API."""
        response = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    def chat(self, user_message: str, session_id: str = "default") -> dict:
        """
        Process a chat message:
        1. Retrieve RAG context
        2. Build message history
        3. Call LLM (HF or OpenAI)
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
            if self.use_hf:
                response_text = self._call_hf(messages)
            else:
                response_text = self._call_openai(messages)
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            # Try fallback
            try:
                if self.use_hf:
                    response_text = self._call_openai(messages)
                    logger.info("Fell back to OpenAI")
                else:
                    raise e
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                response_text = (
                    "Samahani, kuna tatizo la muda. Tafadhali jaribu tena."
                    if any(c in user_message.lower() for c in ["habari", "saidia", "nataka", "tafadhali"])
                    else "Sorry, there was a temporary issue. Please try again."
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
