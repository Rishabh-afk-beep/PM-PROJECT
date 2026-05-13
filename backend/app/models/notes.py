"""Notes Pydantic models — Category → Subcategory → Note."""

from pydantic import BaseModel


class NoteCategoryCreate(BaseModel):
    name: str


class NoteCategoryResponse(BaseModel):
    id: str
    name: str


class NoteSubcategoryCreate(BaseModel):
    category_id: str
    name: str


class NoteSubcategoryResponse(BaseModel):
    id: str
    category_id: str
    name: str


class NoteCreate(BaseModel):
    subcategory_id: str
    title: str
    drive_link: str


class NoteResponse(BaseModel):
    id: str
    subcategory_id: str
    title: str
    drive_link: str
    created_at: str
