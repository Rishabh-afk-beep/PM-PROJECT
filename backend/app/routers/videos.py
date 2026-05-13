"""Video links CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud.firestore_v1 import Query

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.videos import VideoLinkCreate, VideoLinkResponse
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Video Links"])


@router.get("/videos", response_model=list[VideoLinkResponse])
async def list_videos(
    subcategory_id: str | None = None,
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    query = db.collection("video_links")
    if subcategory_id:
        query = query.where("subcategory_id", "==", subcategory_id)
        docs = [doc async for doc in query.stream()]
        items = serialize_docs(docs)
        # Avoid composite index requirement by sorting in memory.
        items.sort(key=lambda item: item.get("created_at") or "", reverse=True)
        return items
    query = query.order_by("created_at", direction=Query.DESCENDING)
    docs = [doc async for doc in query.stream()]
    return serialize_docs(docs)


@router.post("/videos", status_code=status.HTTP_201_CREATED)
async def create_video(
    payload: VideoLinkCreate,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_links").document()
    doc = {
        "subcategory_id": payload.subcategory_id,
        "title": payload.title,
        "youtube_link": payload.youtube_link,
        "uploaded_by": admin["id"],
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Video link added"}


@router.put("/videos/{video_id}")
async def update_video(
    video_id: str,
    payload: VideoLinkCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_links").document(video_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    update = {
        "title": payload.title,
        "youtube_link": payload.youtube_link,
        "subcategory_id": payload.subcategory_id,
    }
    await doc_ref.update(update)
    return {"message": "Video updated"}


@router.delete("/videos/{video_id}")
async def delete_video(video_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("video_links").document(video_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    await doc_ref.delete()
    return {"message": "Video deleted"}
