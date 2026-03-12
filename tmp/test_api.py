import urllib.request
import json
import os

url = "https://ai.ezif.in/v1/chat/completions"
api_key = "sk-AomiXb5Afi4USQZ44GnEiPyM6nEzqNkgWfIPeoQQnlsS6lIf"
model = "qwen3.5-flash"

data = {
    "model": model,
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say hello!"}
    ]
}

req = urllib.request.Request(url, json.dumps(data).encode('utf-8'))
req.add_header('Content-Type', 'application/json')
req.add_header('Authorization', f'Bearer {api_key}')
req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

try:
    with urllib.request.urlopen(req) as response:
        print("Status code:", response.status)
        body = response.read().decode('utf-8')
        print("Response:", body)
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.reason)
    print("Response payload:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
