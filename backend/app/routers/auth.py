"""Auth routes — registration/profile and current user."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import UserCreate, UserResponse
from app.utils.helpers import serialize_doc, utcnow

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, user: dict = Depends(get_current_user)):
    """Create/update the user profile after Firebase sign-in."""
    db = get_db()
    doc_ref = db.collection("users").document(user["id"])

    if payload.email and user.get("email") and payload.email != user.get("email"):
        raise HTTPException(status_code=400, detail="Email does not match authenticated user")

    updates = {
        "name": payload.name,
        "phone": payload.phone,
        "email": user.get("email") or payload.email,
        "updated_at": utcnow(),
    }
    await doc_ref.set(updates, merge=True)
    return {
        "id": user["id"],
        "message": "Profile updated successfully",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile and role."""
    return serialize_doc(user)
