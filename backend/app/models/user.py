"""User Pydantic models."""

from typing import Literal

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    firebase_uid: str = ""
    name: str
    email: EmailStr
    phone: str
    role: Literal["student", "admin"] = "student"
    tenant_id: str = "default_school"  # For Database Sharding / Multi-Tenancy


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str
    role: str
    profile_picture_url: str | None = None
    tenant_id: str = "default_school"


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    profile_picture_url: str | None = None
