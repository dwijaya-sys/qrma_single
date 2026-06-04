import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    AI_SYNTHESIS_PROMPT_VERSION = os.getenv("AI_SYNTHESIS_PROMPT_VERSION", "v1")
    PATIENT_SUMMARY_PROMPT_VERSION = os.getenv("PATIENT_SUMMARY_PROMPT_VERSION", "v1")
    ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
