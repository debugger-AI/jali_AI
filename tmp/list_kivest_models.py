import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL")
)

try:
    print("Fetching models from Kivest API...")
    models = client.models.list()
    for m in models.data:
        print(m.id)
except Exception as e:
    print(f"Failed: {e}")
