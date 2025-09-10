import os
from dataclasses import dataclass

@dataclass
class Config:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-prod")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///data/app.sqlite3")
    ADMIN_SETUP_TOKEN: str | None = os.getenv("ADMIN_SETUP_TOKEN")
    SQLALCHEMY_ECHO: bool = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

cfg = Config()
