"""
Jali Chat Service
- RAG-powered conversational AI
- Bilingual: Swahili + English
- LLM backend: Groq (openai/gpt-oss-120b)
- Maintains conversation history per session
"""

import os
import logging
from typing import List, Dict
from dotenv import load_dotenv
from groq import Groq

from ai.rag_pipeline import JaliVectorStore

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq configuration
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY is not set. Add it to your .env file.")

groq_client = Groq(api_key=GROQ_API_KEY)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Jali, a bilingual (Swahili/English) AI medical assistant specifically specialized in prenatal care, maternal health, and pediatrics (infants).

You help Community Health Volunteers (CHVs) and Case Managers with:
- Prenatal care guidelines and danger signs during pregnancy
- Postnatal care and maternal recovery
- Infant immunization schedules and growth monitoring
- Breastfeeding, nutrition, and weaning guidelines
- Identifying risks in newborns and when to escalate to a clinic

Rules:
1. If the user writes in Swahili, respond in Swahili. If English, respond in English.
2. Use the provided CONTEXT to give accurate, evidence-based answers.
3. If context is provided, cite the source document when relevant.
4. Be concise, empathetic, and culturally appropriate for maternal care in Kenya.
5. For serious medical emergencies, always advise consulting a doctor or rushing to a clinic immediately.
6. Never fabricate medical information. Say "sijui" (I don't know) if unsure.
7. Keep responses under 200 words unless the user asks for detail."""


class JaliChatService:
    """RAG-powered chat with conversation memory and bilingual support."""

    def __init__(self):
        self.vector_store = JaliVectorStore()
        self.conversations: Dict[str, List[dict]] = {}  # session_id -> messages
        logger.info(f"JaliChatService initialised — Groq model: {GROQ_MODEL}")

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------
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

    def _call_groq(self, messages: List[dict]) -> str:
        """Send messages to Groq and return content."""
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
        )
        return completion.choices[0].message.content.strip()

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------
    def chat(self, user_message: str, session_id: str = "default") -> dict:
        """
        Process a chat message:
        1. Retrieve RAG context
        2. Build prompt with history
        3. Call Groq
        4. Persist to history
        """
        history = self._get_history(session_id)

        # RAG retrieval
        context = self._retrieve_context(user_message)

        # Build system prompt (inject RAG context when available)
        system_content = SYSTEM_PROMPT
        if context:
            system_content += f"\n\nCONTEXT from Jali health documents:\n{context}"

        # Build message list: system + last 10 turns + new user message
        messages = [{"role": "system", "content": system_content}]
        messages.extend(history[-10:])
        messages.append({"role": "user", "content": user_message})

        # Call Groq
        try:
            response_text = self._call_groq(messages)
        except Exception as e:
            logger.error(f"Groq call failed: {e}")
            is_swahili = any(
                w in user_message.lower()
                for w in ["habari", "saidia", "nataka", "tafadhali", "jambo"]
            )
            response_text = (
                "Samahani, kuna tatizo la muda. Tafadhali jaribu tena baadaye."
                if is_swahili
                else "Sorry, there was a temporary issue. Please try again."
            )

        # Persist to history
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": response_text})

        # Trim to last 20 messages
        if len(history) > 20:
            self.conversations[session_id] = history[-20:]

        return {
            "response": response_text,
            "has_context": bool(context),
            "session_id": session_id,
            "model": GROQ_MODEL,
        }

    def clear_session(self, session_id: str):
        """Clear conversation history for a session."""
        self.conversations.pop(session_id, None)
