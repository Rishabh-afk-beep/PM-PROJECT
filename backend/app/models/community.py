"""Community Pydantic models — Posts + Comments."""

from pydantic import BaseModel


class PostCreate(BaseModel):
    content: str
    image_url: str | None = None


class PostResponse(BaseModel):
    id: str
    author_name: str
    author_avatar: str | None = None
    content: str
    image_url: str | None = None
    likes: list[str] = []
    comment_count: int = 0
    created_at: str


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_name: str
    content: str
    created_at: str
