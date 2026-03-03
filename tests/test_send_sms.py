"""
Quick SMS test — sends one message to +254759540054 via AfricasTalking.
Run from project root: python tests/test_send_sms.py
"""
import sys
import os
import requests
import warnings
from urllib3.exceptions import InsecureRequestWarning

# Suppress insecure request warnings
warnings.simplefilter('ignore', InsecureRequestWarning)

# Monkeypatch requests to disable SSL verification (AT sandbox SSL is broken on Python 3.12 urllib3)
old_request = requests.Session.request
def new_request(*args, **kwargs):
    kwargs['verify'] = False
    return old_request(*args, **kwargs)
requests.Session.request = new_request

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
