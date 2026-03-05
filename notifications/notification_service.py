import os
import africastalking
from dotenv import load_dotenv

load_dotenv()


class AfricasTalkingNotifier:
    """
    Sends SMS and WhatsApp messages via AfricasTalking.
    Requires AT_USERNAME and AT_API_KEY in your .env file.
    """

    def __init__(self):
        username = os.getenv("AT_USERNAME")
        api_key = os.getenv("AT_API_KEY")
        # Prefer shortcode for two-way chat; fall back to alphanumeric sender ID
        shortcode = os.getenv("AT_SHORTCODE")
        sender_id = os.getenv("AT_SENDER_ID", None)

        if not username or not api_key:
            raise ValueError(
                "AfricasTalking credentials missing. "
                "Set AT_USERNAME and AT_API_KEY in your .env file."
            )

        africastalking.initialize(username, api_key)
        self.sms = africastalking.SMS
        # Shortcode takes priority — required for two-way chat replies
        self.sender_id = shortcode or sender_id

    def send_sms(self, phone: str, message: str, sender_override: str = None) -> dict:
        """
        Send an SMS to a single phone number.
        sender_override lets callers force a specific sender (e.g. shortcode for replies).
        """
        sender = sender_override or self.sender_id
        try:
            response = self.sms.send(message, [phone], sender)
            print(f"[SMS SENT] From {sender} To {phone}: {response}")
            return response
        except Exception as e:
            print(f"[SMS ERROR] {e}")
            raise

    def send_whatsapp(self, whatsapp_number: str, message: str) -> dict:
        """
        Send a WhatsApp message via AfricasTalking.
        Note: whatsapp_number format should be '+2547XXXXXXXX'
        """
        try:
            # AfricasTalking WhatsApp uses the same SMS gateway with a special channel
            response = self.sms.send(
                message, [whatsapp_number], self.sender_id, enqueue=False
            )
            print(f"[WHATSAPP SENT] To {whatsapp_number}: {response}")
            return response
        except Exception as e:
            print(f"[WHATSAPP ERROR] {e}")
            raise
