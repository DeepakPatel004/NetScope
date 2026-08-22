import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", ""))).strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", os.getenv("GEMINI_MODEL", "openai/gpt-oss-20b")).strip()
    AI_ENABLED: bool = os.getenv("AI_ENABLED", "true").lower() == "true"

settings = Settings()
