"""Firestore async client singleton."""

from __future__ import annotations

import json
import inspect

from google.cloud.firestore_v1.async_client import AsyncClient
from google.oauth2 import service_account

from app.config import settings

client: AsyncClient | None = None


def _load_project_id(path: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data.get("project_id")
    except Exception:
        return None


async def connect_db() -> None:
    """Create the Firestore async client."""
    global client
    if client is not None:
        return
    creds = service_account.Credentials.from_service_account_file(
        settings.firebase_credentials_path,
    )
    project_id = settings.firebase_project_id or _load_project_id(settings.firebase_credentials_path)
    client = AsyncClient(credentials=creds, project=project_id)


async def close_db() -> None:
    """Close the Firestore client."""
    global client
    if client is not None:
        result = client.close()
        if inspect.isawaitable(result):
            await result
    client = None


def get_db() -> AsyncClient:
    """Return the database instance. Raises if not connected."""
    if client is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return client
