import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class BaseNotifier:
    """Base class for notifications."""
    def send_sms(self, phone: str, message: str) -> dict:
        logger.info(f"[SMS LOG] To {phone}: {message}")
        return {"status": "success", "channel": "sms"}

    def send_whatsapp(self, whatsapp_number: str, message: str) -> dict:
        logger.info(f"[WHATSAPP LOG] To {whatsapp_number}: {message}")
        return {"status": "success", "channel": "whatsapp"}
