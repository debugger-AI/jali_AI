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
# from groq import Groq (Lazy loaded)
from duckduckgo_search import DDGS

from ai.rag_pipeline import JaliVectorStore

load_dotenv()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Groq configuration (Lazy loading)
# ---------------------------------------------------------------------------
_groq_client = None

def get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import Groq
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY is not set. Add it to your .env file.")
        _groq_client = Groq(api_key=api_key)
    return _groq_client

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Jali, a highly specialized, empathetic AI assistant (English & Swahili) built specifically for the Jali OVC (Orphans and Vulnerable Children) Case Management System in Kenya. 

You exclusively support Community Health Volunteers (CHVs) and Case Managers.

CORE DOMAIN KNOWLEDGE:
1. OVC Health & HIV Monitoring: Tracking ART (Antiretroviral Therapy) adherence, HIV status, viral load suppression, and immunization schedules.
2. Psychosocial & Economic Support: Advising caregivers on linkage to schools, disability support (NCPWD), and birth certification.
3. Maternal & Child Health: Danger signs in pregnancy, postnatal care, and infant weaning.

OPERATIONAL RULES:
- Language Matching: Respond purely in the language the user speaks (Swahili for Swahili, English for English, Sheng where appropriate for rapport).
- Evidence-Based: Base answers strictly on the provided CONTEXT. If citing context, mention the source cleanly.
- Keep it Concise & Actionable: CHVs are in the field and read on mobile devices. Keep answers under 150 words. Use bullet points heavily.
- Escalation Protocol: For missed ART doses, very high viral loads, or maternal danger signs, explicitly emphasize escalating to the Linkage Facility immediately.
- Ignorance is Safe: If you do not know the answer, say "Samahani, sina uhakika na hilo" or "I don't have that information." Do not hallucinate.

EXAMPLES OF DESIRED BEHAVIOR:
User: "Mama yuko mjamzito na anavuja damu, nifanyeje?"
Jali: "Hii ni hatari! Mpeleke mama kituo cha afya haraka iwezekanavyo (Escalation). Kuvuja damu wakati wa ujauzito ni dalili ya hatari inayohitaji msaada wa daktari mara moja."

User: "OVC missed their ART medication for 2 days."
Jali: 
- Counsel the caregiver on the critical importance of daily adherence for viral suppression.
- Instruct them to take the missed dose immediately if remembered early, but never double the dose.
- Log this adherence issue in the Jali system and notify the linkage facility.
- Schedule a follow-up visit tomorrow to monitor the child."""


class JaliChatService:
    """RAG-powered chat with conversation memory and bilingual support."""

    def __init__(self):
        self.vector_store = JaliVectorStore()
        self.ddgs = DDGS()
        self.conversations: Dict[str, List[dict]] = {}  # session_id -> messages
        self.model = os.getenv("GROQ_MODEL", "llama3-70b-8192")
        logger.info(f"JaliChatService initialised — Model: {self.model}")

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

    def _internet_search(self, query: str) -> str:
        """Search the internet using DuckDuckGo to supplement RAG context."""
        try:
            # We add keywords to bias the search toward medical/Kenya context
            search_query = f"{query} medical health kenya"
            results = self.ddgs.text(search_query, max_results=3)
            
            if not results:
                return ""
                
            context_parts = []
            for r in results:
                title = r.get("title", "Web Source")
                body = r.get("body", "")
                link = r.get("href", "")
                context_parts.append(f"[{title} ({link})]\n{body}")
                
            return "\n\n---\n\n".join(context_parts)
        except Exception as e:
            logger.warning(f"Internet search failed: {e}")
            return ""

    def _call_groq(self, messages: List[dict]) -> str:
        """Send messages to Groq and return content."""
        client = get_groq_client()
        completion = client.chat.completions.create(
            model=self.model,
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
        local_context = self._retrieve_context(user_message)
        
        # If no local context or question explicitly requires external data, search the web
        web_context = ""
        # Basic heuristic: if local context is empty, try web search
        if not local_context:
             web_context = self._internet_search(user_message)

        # Build system prompt (inject RAG and/or Web context when available)
        system_content = SYSTEM_PROMPT
        
        if local_context:
            system_content += f"\n\nCONTEXT from Jali internal health documents:\n{local_context}"
            
        if web_context:
            system_content += f"\n\nCONTEXT from external Web Search (Verify carefully):\n{web_context}"

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
            "has_context": bool(local_context or web_context),
            "session_id": session_id,
            "model": self.model,
        }

    def clear_session(self, session_id: str):
        """Clear conversation history for a session."""
        self.conversations.pop(session_id, None)
