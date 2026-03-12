import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("OPENAI_API_KEY")
base_url = os.environ.get("OPENAI_BASE_URL")
model = os.environ.get("OPENAI_MODEL", "qwen3.5-flash")

print(f"API Key: {api_key}")
print(f"Base URL: {base_url}")
print(f"Model: {model}")

try:
    client = OpenAI(
        api_key=api_key,
        base_url=base_url
    )
    
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "What are the common danger signs during pregnancy?"}],
        max_tokens=50,
        temperature=0.7,
    )
    print("Success!")
    print(response.choices[0].message.content)
except Exception as e:
    import traceback
    print("Error:")
    traceback.print_exc()
