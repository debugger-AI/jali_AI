import os
import logging
from dotenv import load_dotenv

from .notification_service import AfricasTalkingNotifier

load_dotenv()
logger = logging.getLogger(__name__)


def _load_contact(user_id: str) -> dict:
    """
    Loads user contact info from environment variables.
    In production, this should query your PostgreSQL or Snowflake database.
    Format: USER_<ID>_PHONE=+2547XXXXXXXX
    """
    phone = os.getenv(f"USER_{user_id}_PHONE")
    whatsapp = os.getenv(f"USER_{user_id}_WHATSAPP")
    if not phone and not whatsapp:
        logger.warning(
            f"No contact found for user {user_id}. "
            "Set USER_{user_id}_PHONE or USER_{user_id}_WHATSAPP in your .env"
        )
    return {"phone": phone, "whatsapp": whatsapp}


class AlertManager:
    """High-level manager to dispatch AI-generated messages to users."""

    def __init__(self):
        try:
            self.notifier = AfricasTalkingNotifier()
            logger.info("AfricasTalking notifier initialized.")
        except ValueError as e:
            logger.warning(f"Notifier not configured: {e}. Running in DRY_RUN mode.")
            self.notifier = None

    def _send(self, contact: dict, message: str, channel: str):
        # Fallback to dry run if notifier isn't configured
        if not self.notifier:
            logger.info(
                f"[DRY RUN] Would send {channel} to "
                f"{contact.get('phone') or contact.get('whatsapp', 'unknown')}: {message}"
            )
            return

        if channel == "sms" and contact.get("phone"):
            self.notifier.send_sms(contact["phone"], message)
        elif channel == "whatsapp" and contact.get("whatsapp"):
            self.notifier.send_whatsapp(contact["whatsapp"], message)
        else:
            logger.error(f"No valid {channel} contact found: {contact}")

    def send_pad_reminder(self, user_id: str, next_period: str) -> None:
        contact = _load_contact(user_id)
        msg = (
            f"Hi from Jali! Your next period is expected around {next_period}. "
            f"Remember to pick up sanitary pads from the nearest Jali centre."
        )
        self._send(contact, msg, "sms")

    def send_immunisation_reminder(
        self, user_id: str, child_name: str, vaccine: str, date: str
    ) -> None:
        contact = _load_contact(user_id)
        msg = (
            f"Hello, your child {child_name} is due for the {vaccine} vaccine on {date}. "
            f"Please bring them to the clinic for immunisation."
        )
        self._send(contact, msg, "whatsapp")

    def send_drug_adherence(self, user_id: str, drug_name: str, time: str) -> None:
        contact = _load_contact(user_id)
        msg = (
            f"Jali Health Reminder: It's time to take your {drug_name} medication ({time}). "
            f"Stay consistent and stay healthy!"
        )
        self._send(contact, msg, "sms")

    def send_custom(self, user_id: str, message: str, channel: str = "sms") -> None:
        contact = _load_contact(user_id)
        self._send(contact, message, channel)

    def send_to_number(self, phone: str, message: str) -> None:
        """Send directly to a known phone number (used in real-time webhook replies)."""
        if not self.notifier:
            logger.info(f"[DRY RUN] Would SMS {phone}: {message}")
            return
        self.notifier.send_sms(phone, message)
