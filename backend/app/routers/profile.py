"""Profile update route."""

from fastapi import APIRouter, Depends

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import ProfileUpdate, UserResponse
from app.utils.helpers import serialize_doc, utcnow

router = APIRouter(tags=["Profile"])


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    db = get_db()

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.phone is not None:
        update_data["phone"] = payload.phone
    if payload.profile_picture_url is not None:
        update_data["profile_picture_url"] = payload.profile_picture_url
    update_data["updated_at"] = utcnow()

    doc_ref = db.collection("users").document(user["id"])
    await doc_ref.update(update_data)
    updated = await doc_ref.get()
    return serialize_doc(updated)
