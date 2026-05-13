"""Mentorship Pydantic models — dynamic categories + mentee students."""

from pydantic import BaseModel


class MentorshipCategoryCreate(BaseModel):
    name: str


class MentorshipCategoryResponse(BaseModel):
    id: str
    name: str


class MenteeStudentCreate(BaseModel):
    name: str
    email: str
    phone: str
    marks_sheet_link: str | None = None
    category_values: dict[str, str] = {}


class MenteeStudentUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    marks_sheet_link: str | None = None
    category_values: dict[str, str] | None = None


class MenteeStudentResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    marks_sheet_link: str | None = None
    category_values: dict[str, str] = {}
    created_at: str
