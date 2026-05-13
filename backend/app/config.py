"""Application settings loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Firebase
    firebase_credentials_path: str = "e:/PM/google-credentials.json"
    firebase_credentials_json: str = ""  # Base64 or raw JSON string for Render
    firebase_project_id: str = ""

    # Admin allowlist (comma-separated emails)
    admin_emails: str = ""

    # Dev auth mode — bypasses Firebase, uses X-Dev-User-Id header
    dev_auth_mode: bool = False

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]

    model_config = {
        "env_file": str(Path(__file__).resolve().parents[1] / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
