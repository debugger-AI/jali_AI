import os
import sys

# Add the project root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ai.llm_service import LLMService

def test_kivest():
    print("Testing Kivest AI integration...")
    service = LLMService()
    
    # Test generation
    context = {"type": "test_alert", "details": "This is a simple test."}
    try:
        response = service.generate_alert_message(context)
        print("\n--- Generate Alert Response ---")
        print(response)
        print("-------------------------------\n")
    except Exception as e:
        print(f"Error testing generate_alert_message: {e}")

    # Test reply
    try:
        reply = service.generate_reply("Hi there, how are you?", user_id="test_user")
        print("\n--- Generate Reply Response ---")
        print(reply)
        print("-------------------------------\n")
    except Exception as e:
        print(f"Error testing generate_reply: {e}")

if __name__ == "__main__":
    test_kivest()
