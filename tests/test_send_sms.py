"""
Quick SMS test — sends one message to +254759540054 via AfricasTalking.
Run from project root: python tests/test_send_sms.py
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from notifications.alert_manager import AlertManager

def main():
    print("Initializing AlertManager...")
    am = AlertManager()

    phone = "+254759540054"
    message = (
        "Hello from Jali AI! This is a test message. "
        "Reply with anything and the AI agent will respond. 🏥"
    )

    print(f"Sending SMS to {phone}...")
    am.send_to_number(phone, message)
    print("Done! Check your AT Simulator (sandbox) or your phone (live).")

if __name__ == "__main__":
    main()
