import os
from dotenv import load_dotenv

load_dotenv()

# Allow origins from environment variable or default to localhost
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
