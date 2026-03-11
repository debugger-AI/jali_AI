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

# OpenAI fallback / Kivest AI
openai_client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL")
)
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.2")

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
        
        # We want to default to Kivest AI via OpenAI client here since it's the primary setup
        self.use_hf = False
        logger.info(f"Using Kivest/OpenAI model: {OPENAI_MODEL}")

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
        """Call OpenAI/Kivest API using requests to handle forced SSE streams."""
        import json
        
        headers = {
            "Authorization": f"Bearer {os.environ.get('OPENAI_API_KEY')}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
            "stream": False # Many APIs ignore this if they strictly stream
        }
        
        url = f"{os.environ.get('OPENAI_BASE_URL').rstrip('/')}/chat/completions"
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        
        text = resp.text
        # If it returns a standard JSON block
        try:
            data = resp.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"].strip()
            return str(data)
        except json.JSONDecodeError:
            pass # Handle SSE stream manually
            
        # Parse SSE (Server Sent Events) format forcibly returned by Kivest
        full_text = ""
        for line in text.split('\n'):
            line = line.strip()
            if line.startswith("data: ") and line != "data: [DONE]":
                try:
                    chunk = json.loads(line[6:])
                    if "choices" in chunk and len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0].get("delta", {})
                        if "content" in delta:
                            full_text += delta["content"]
                except:
                    pass
        return full_text.strip() if full_text else text.strip()

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
            response_text = self._call_openai(messages)
        except Exception as e:
            logger.error(f"Kivest AI call failed: {e}")
            response_text = (
                "Samahani, kuna tatizo la muda kwenye mtandao mkuu wetu. Tafadhali jaribu tena baadae."
                if any(c in user_message.lower() for c in ["habari", "saidia", "nataka", "tafadhali", "jambo"])
                else "Sorry, the Kivest AI server could not be reached or an error occurred. Please check your API usage or network."
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
