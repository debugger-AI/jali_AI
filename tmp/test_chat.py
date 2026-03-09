import sys, os
sys.path.append(os.getcwd())
import logging
logging.basicConfig(level=logging.INFO)
from ai.chat_service import JaliChatService
svc = JaliChatService()
print(svc.chat('Habari'))
