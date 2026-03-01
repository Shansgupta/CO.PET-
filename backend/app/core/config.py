import os
from pathlib import Path

from pydantic import BaseModel
from dotenv import load_dotenv

# Load env from backend/.env (and fall back to CWD .env)
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
load_dotenv()


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "Pet Lending MVP API")
    mongo_url: str = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    mongo_db: str = os.getenv("MONGO_DB", "pet_lending_mvp")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-this-in-real-deployments")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24))
    )
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    borrower_commission_rate: float = float(os.getenv("BORROWER_COMMISSION_RATE", "0.10"))
    lender_commission_rate: float = float(os.getenv("LENDER_COMMISSION_RATE", "0.05"))


settings = Settings()
