"""Note categories and subcategories routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.notes import (
    NoteCategoryCreate,
    NoteCategoryResponse,
    NoteSubcategoryCreate,
    NoteSubcategoryResponse,
)
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Note Categories"])


async def _delete_notes_by_subcategory(db, subcat_id: str) -> None:
    query = db.collection("notes").where("subcategory_id", "==", subcat_id)
    docs = [doc async for doc in query.stream()]
    if not docs:
        return
    batch = db.batch()
    for doc in docs:
        batch.delete(doc.reference)
    await batch.commit()


# ── Categories ─────────────────────────────────────────────

@router.get("/note-categories", response_model=list[NoteCategoryResponse])
async def list_categories(_user: dict = Depends(get_current_user)):
    db = get_db()
    docs = [doc async for doc in db.collection("note_categories").stream()]
    return serialize_docs(docs)


@router.post("/note-categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: NoteCategoryCreate,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("note_categories").document()
    doc = {
        "name": payload.name,
        "created_by": admin["id"],
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Category created"}


@router.put("/note-categories/{cat_id}")
async def update_category(
    cat_id: str,
    payload: NoteCategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("note_categories").document(cat_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Category not found")
    await doc_ref.update({"name": payload.name})
    return {"message": "Category updated"}


@router.delete("/note-categories/{cat_id}")
async def delete_category(cat_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    cat_ref = db.collection("note_categories").document(cat_id)
    cat_doc = await cat_ref.get()
    if not cat_doc.exists:
        raise HTTPException(status_code=404, detail="Category not found")

    # Cascade: delete subcategories and their notes
    subcats = [doc async for doc in db.collection("note_subcategories").where("category_id", "==", cat_id).stream()]
    for subcat in subcats:
        await _delete_notes_by_subcategory(db, subcat.id)
        await subcat.reference.delete()

    # Also delete notes directly under the category (subcategory_id == "cat-{id}")
    await _delete_notes_by_subcategory(db, f"cat-{cat_id}")

    await cat_ref.delete()
    return {"message": "Category and associated items deleted"}


# ── Subcategories ──────────────────────────────────────────

@router.get("/note-subcategories", response_model=list[NoteSubcategoryResponse])
async def list_subcategories(
    category_id: str | None = None,
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    query = db.collection("note_subcategories")
    if category_id:
        query = query.where("category_id", "==", category_id)
    docs = [doc async for doc in query.stream()]
    return serialize_docs(docs)


@router.post("/note-subcategories", status_code=status.HTTP_201_CREATED)
async def create_subcategory(
    payload: NoteSubcategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("note_subcategories").document()
    doc = {
        "category_id": payload.category_id,
        "name": payload.name,
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Subcategory created"}


@router.put("/note-subcategories/{sub_id}")
async def update_subcategory(
    sub_id: str,
    payload: NoteCategoryCreate,  # reuse — only needs name
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("note_subcategories").document(sub_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    await doc_ref.update({"name": payload.name})
    return {"message": "Subcategory updated"}


@router.delete("/note-subcategories/{sub_id}")
async def delete_subcategory(sub_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("note_subcategories").document(sub_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Subcategory not found")

    await _delete_notes_by_subcategory(db, sub_id)
    await doc_ref.delete()
    return {"message": "Subcategory and notes deleted"}
