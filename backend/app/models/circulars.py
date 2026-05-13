"""Circulars Pydantic models."""

from pydantic import BaseModel


class CircularCreate(BaseModel):
    title: str
    description: str
    attachment_link: str | None = None


class CircularResponse(BaseModel):
    id: str
    title: str
    description: str
    attachment_link: str | None = None
    date: str
    created_at: str
