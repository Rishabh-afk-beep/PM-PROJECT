"""Video Pydantic models — Category → Subcategory → VideoLink."""

from pydantic import BaseModel


class VideoCategoryCreate(BaseModel):
    name: str


class VideoCategoryResponse(BaseModel):
    id: str
    name: str


class VideoSubcategoryCreate(BaseModel):
    category_id: str
    name: str


class VideoSubcategoryResponse(BaseModel):
    id: str
    category_id: str
    name: str


class VideoLinkCreate(BaseModel):
    subcategory_id: str
    title: str
    youtube_link: str


class VideoLinkResponse(BaseModel):
    id: str
    subcategory_id: str
    title: str
    youtube_link: str
    created_at: str
