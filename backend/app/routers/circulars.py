"""Circulars CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from google.cloud.firestore_v1 import Query
import asyncio
import logging

logger = logging.getLogger("teachlearn.background")

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.circulars import CircularCreate, CircularResponse
from app.utils.helpers import serialize_docs, utcnow

router = APIRouter(tags=["Circulars"])

async def process_push_notifications_task(circular_id: str, title: str):
    """
    Simulates an asynchronous heavy task (e.g., sending FCM push notifications to 1000s of students).
    In an enterprise system, this would be pushed to Celery/Redis or Pub/Sub.
    """
    logger.info(f"Background Task Started: Processing push notifications for circular '{title}'...")
    await asyncio.sleep(4) # Simulate network delay for 1000 push requests
    logger.info(f"Background Task Completed: Successfully sent push notifications for circular {circular_id}!")


@router.get("/circulars", response_model=list[CircularResponse])
async def list_circulars(_user: dict = Depends(get_current_user)):
    db = get_db()
    query = db.collection("circulars").order_by("created_at", direction=Query.DESCENDING)
    docs = [doc async for doc in query.stream()]
    return serialize_docs(docs)


@router.post("/circulars", status_code=status.HTTP_201_CREATED)
async def create_circular(
    payload: CircularCreate,
    background_tasks: BackgroundTasks,
    admin: dict = Depends(require_admin),
):
    db = get_db()
    now = utcnow()
    doc_ref = db.collection("circulars").document()
    doc = {
        "title": payload.title,
        "description": payload.description,
        "attachment_link": payload.attachment_link,
        "posted_by": admin["id"],
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now,
    }
    await doc_ref.set(doc)

    # 3. Asynchronous Processing (Event-Driven)
    # The user doesn't wait for this; the API returns immediately.
    background_tasks.add_task(process_push_notifications_task, doc_ref.id, payload.title)

    return {"id": doc_ref.id, "message": "Circular posted. Notifications are being sent in the background."}


@router.delete("/circulars/{circular_id}")
async def delete_circular(circular_id: str, _admin: dict = Depends(require_admin)):
    db = get_db()
    doc_ref = db.collection("circulars").document(circular_id)
    doc = await doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Circular not found")
    await doc_ref.delete()
    return {"message": "Circular deleted"}
