"""Mentorship routes — dynamic categories + mentee student records."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import require_admin
from app.models.mentorship import (
    MentorshipCategoryCreate,
    MentorshipCategoryResponse,
    MenteeStudentCreate,
    MenteeStudentUpdate,
    MenteeStudentResponse,
)
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Mentorship"])


# ── Mentorship Categories ──────────────────────────────────

@router.get("/mentorship-categories", response_model=list[MentorshipCategoryResponse])
async def list_categories(_admin: dict = Depends(require_admin)):
    db = get_db()
    docs = [doc async for doc in db.collection("mentorship_categories").stream()]
    return serialize_docs(docs)


@router.post("/mentorship-categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: MentorshipCategoryCreate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("mentorship_categories").document()
    doc = {"name": payload.name, "created_at": utcnow()}
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Mentorship category created"}


@router.delete("/mentorship-categories/{cat_id}")
async def delete_category(cat_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("mentorship_categories").document(cat_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Category not found")

    # Remove this category key from all mentee students' category_values
    mentees = [doc async for doc in db.collection("mentee_students").stream()]
    if mentees:
        batch = db.batch()
        updated = False
        for mentee in mentees:
            values = mentee.to_dict().get("category_values", {})
            if cat_id in values:
                values.pop(cat_id, None)
                batch.update(mentee.reference, {"category_values": values, "updated_at": utcnow()})
                updated = True
        if updated:
            await batch.commit()

    await doc_ref.delete()
    return {"message": "Mentorship category removed"}


# ── Mentee Students ────────────────────────────────────────

@router.get("/mentees", response_model=list[MenteeStudentResponse])
async def list_mentees(_admin: dict = Depends(require_admin)):
    db = get_db()
    docs = [doc async for doc in db.collection("mentee_students").stream()]
    return serialize_docs(docs)


@router.post("/mentees", status_code=status.HTTP_201_CREATED)
async def create_mentee(
    payload: MenteeStudentCreate,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("mentee_students").document()
    doc = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "marks_sheet_link": payload.marks_sheet_link,
        "category_values": payload.category_values,
        "managed_by": admin["id"],
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await doc_ref.set(doc)
    return {"id": doc_ref.id, "message": "Student added"}


@router.put("/mentees/{mentee_id}")
async def update_mentee(
    mentee_id: str,
    payload: MenteeStudentUpdate,
    _admin: dict = Depends(require_admin),
):
    db = get_db()
    doc_ref = db.collection("mentee_students").document(mentee_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = {}
    for field in ["name", "email", "phone", "marks_sheet_link", "category_values"]:
        value = getattr(payload, field)
        if value is not None:
            update_data[field] = value
    update_data["updated_at"] = utcnow()

    await doc_ref.update(update_data)
    return {"message": "Student updated"}


@router.delete("/mentees/{mentee_id}")
async def delete_mentee(mentee_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("mentee_students").document(mentee_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    await doc_ref.delete()
    return {"message": "Student removed"}
