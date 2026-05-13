"""Notes CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud.firestore_v1 import Query

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.notes import NoteCreate, NoteResponse
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Notes"])


@router.get("/notes", response_model=list[NoteResponse])
async def list_notes(
    subcategory_id: str | None = None,
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    query = db.collection("notes")
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


@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("notes").document()
    doc = {
        "subcategory_id": payload.subcategory_id,
        "title": payload.title,
        "drive_link": payload.drive_link,
        "uploaded_by": admin["id"],
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Note uploaded"}


@router.put("/notes/{note_id}")
async def update_note(
    note_id: str,
    payload: NoteCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("notes").document(note_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Note not found")
    update = {
        "title": payload.title,
        "drive_link": payload.drive_link,
        "subcategory_id": payload.subcategory_id,
    }
    await doc_ref.update(update)
    return {"message": "Note updated"}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("notes").document(note_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Note not found")
    await doc_ref.delete()
    return {"message": "Note deleted"}
