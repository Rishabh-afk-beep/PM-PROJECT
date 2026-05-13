"""Dashboard stats route — admin only."""

from fastapi import APIRouter, Depends

from app.database import get_db
from app.dependencies import require_admin

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats")
async def get_stats(_admin: dict = Depends(require_admin)):
    """Return aggregate counts for the admin dashboard."""
    db = get_db()

    async def count_collection(name: str) -> int:
        docs = [doc async for doc in db.collection(name).stream()]
        return len(docs)

    notes_count = await count_collection("notes")
    note_categories_count = await count_collection("note_categories")
    video_count = await count_collection("video_links")
    video_categories_count = await count_collection("video_categories")
    circulars_count = await count_collection("circulars")
    mentees_count = await count_collection("mentee_students")
    posts_count = await count_collection("posts")
    users_count = await count_collection("users")

    return {
        "total_notes": notes_count,
        "note_categories": note_categories_count,
        "total_videos": video_count,
        "video_categories": video_categories_count,
        "circulars": circulars_count,
        "mentees": mentees_count,
        "community_posts": posts_count,
        "total_users": users_count,
    }
