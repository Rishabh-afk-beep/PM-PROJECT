"""Helper utilities — Firestore serialization, pagination."""

from datetime import datetime, timezone
from typing import Any


def serialize_doc(doc: Any) -> dict | None:
    """Convert a Firestore document (or dict) for JSON response."""
    if doc is None:
        return None

    if hasattr(doc, "to_dict") and hasattr(doc, "id"):
        data = doc.to_dict() or {}
        data["id"] = doc.id
    elif isinstance(doc, dict):
        data = dict(doc)
    else:
        return doc

    result: dict[str, Any] = {}
    for key, value in data.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        else:
            result[key] = value
    return result


def serialize_docs(docs: list[Any]) -> list[dict]:
    """Serialize a list of Firestore documents."""
    return [serialize_doc(d) for d in docs]


def utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)
