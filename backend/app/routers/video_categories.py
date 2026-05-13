"""Video categories and subcategories routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.videos import (
    VideoCategoryCreate,
    VideoCategoryResponse,
    VideoSubcategoryCreate,
    VideoSubcategoryResponse,
)
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Video Categories"])


async def _delete_videos_by_subcategory(db, subcat_id: str) -> None:
    query = db.collection("video_links").where("subcategory_id", "==", subcat_id)
    docs = [doc async for doc in query.stream()]
    if not docs:
        return
    batch = db.batch()
    for doc in docs:
        batch.delete(doc.reference)
    await batch.commit()


# ── Categories ─────────────────────────────────────────────

@router.get("/video-categories", response_model=list[VideoCategoryResponse])
async def list_categories(_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = [doc async for doc in db.collection("video_categories").stream()]
    return serialize_docs(docs)


@router.post("/video-categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: VideoCategoryCreate,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_categories").document()
    doc = {"name": payload.name, "created_by": admin["id"], "created_at": utcnow()}
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Video category created"}


@router.put("/video-categories/{cat_id}")
async def update_category(
    cat_id: str,
    payload: VideoCategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_categories").document(cat_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video category not found")
    await doc_ref.update({"name": payload.name})
    return {"message": "Video category updated"}


@router.delete("/video-categories/{cat_id}")
async def delete_category(cat_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    cat_ref = db.collection("video_categories").document(cat_id)
    cat_doc = await cat_ref.get()
    if not cat_doc.exists:
        raise HTTPException(status_code=404, detail="Video category not found")

    # Cascade: delete subcategories and their videos
    subcats = [doc async for doc in db.collection("video_subcategories").where("category_id", "==", cat_id).stream()]
    for subcat in subcats:
        await _delete_videos_by_subcategory(db, subcat.id)
        await subcat.reference.delete()

    await _delete_videos_by_subcategory(db, f"cat-{cat_id}")

    await cat_ref.delete()
    return {"message": "Video category and associated items deleted"}


# ── Subcategories ──────────────────────────────────────────

@router.get("/video-subcategories", response_model=list[VideoSubcategoryResponse])
async def list_subcategories(
    category_id: str | None = None,
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    query = db.collection("video_subcategories")
    if category_id:
        query = query.where("category_id", "==", category_id)
    docs = [doc async for doc in query.stream()]
    return serialize_docs(docs)


@router.post("/video-subcategories", status_code=status.HTTP_201_CREATED)
async def create_subcategory(
    payload: VideoSubcategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_subcategories").document()
    doc = {
        "category_id": payload.category_id,
        "name": payload.name,
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Video subcategory created"}


@router.put("/video-subcategories/{sub_id}")
async def update_subcategory(
    sub_id: str,
    payload: VideoCategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("video_subcategories").document(sub_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video subcategory not found")
    await doc_ref.update({"name": payload.name})
    return {"message": "Video subcategory updated"}


@router.delete("/video-subcategories/{sub_id}")
async def delete_subcategory(sub_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("video_subcategories").document(sub_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video subcategory not found")

    await _delete_videos_by_subcategory(db, sub_id)
    await doc_ref.delete()
    return {"message": "Video subcategory and videos deleted"}
