"""Community routes — posts, comments, likes."""

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud.firestore_v1 import ArrayRemove, ArrayUnion, Increment, Query

from app.database import get_db
from app.dependencies import get_current_user
from app.models.community import CommentCreate, CommentResponse, PostCreate, PostResponse
from app.utils.helpers import serialize_docs, utcnow
from app.routers.websocket import manager

router = APIRouter(tags=["Community"])


# ── Posts ───────────────────────────────────────────────────

@router.get("/posts", response_model=list[PostResponse])
async def list_posts(
    limit: int = 20,
    start_after: str | None = None,
    _user: dict = Depends(get_current_user),
):
    db = get_db()
    safe_limit = max(1, min(limit, 50))
    
    query = (
        db.collection("posts")
        .order_by("created_at", direction=Query.DESCENDING)
        .limit(safe_limit)
    )
    
    if start_after:
        # Cursor pagination: get the document to start after
        start_doc_ref = db.collection("posts").document(start_after)
        start_doc = await start_doc_ref.get()
        if start_doc.exists:
            query = query.start_after(start_doc)

    docs = [doc async for doc in query.stream()]
    return serialize_docs(docs)


@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def create_post(payload: PostCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    doc_ref = db.collection("posts").document()
    doc = {
        "author_uid": user["id"],
        "author_name": user["name"],
        "author_avatar": user.get("profile_picture_url"),
        "content": payload.content,
        "image_url": payload.image_url,
        "likes": [],
        "comment_count": 0,
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)

    # 4. Real-time Communication (WebSockets)
    # Broadcast the new post instantly to all connected clients!
    doc["id"] = doc_ref.id
    doc["created_at"] = doc["created_at"].isoformat()
    await manager.broadcast({"type": "new_post", "post": doc})

    return {"id": doc_ref.id, "message": "Post created"}


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    post_ref = db.collection("posts").document(post_id)
    post_doc = await post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    post = post_doc.to_dict() or {}
    is_author = post.get("author_uid") == user["id"]
    is_admin = user.get("role") == "admin"
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    # Delete associated comments
    comments = [doc async for doc in db.collection("comments").where("post_id", "==", post_id).stream()]
    if comments:
        batch = db.batch()
        for comment in comments:
            batch.delete(comment.reference)
        await batch.commit()

    await post_ref.delete()
    return {"message": "Post deleted"}


# ── Likes ───────────────────────────────────────────────────

@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    post_ref = db.collection("posts").document(post_id)
    post_doc = await post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    post = post_doc.to_dict() or {}
    uid = user["id"]
    likes = post.get("likes", [])

    if uid in likes:
        await post_ref.update({"likes": ArrayRemove([uid])})
        return {"liked": False}

    await post_ref.update({"likes": ArrayUnion([uid])})
    return {"liked": True}


# ── Comments ────────────────────────────────────────────────

@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(post_id: str, _user: dict = Depends(get_current_user)):
    db = get_db()
    query = db.collection("comments").where("post_id", "==", post_id)
    docs = [doc async for doc in query.stream()]
    items = serialize_docs(docs)
    # Avoid composite index requirement by sorting in memory.
    items.sort(key=lambda item: item.get("created_at") or "")
    return items


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: str,
    payload: CommentCreate,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    post_ref = db.collection("posts").document(post_id)
    post_doc = await post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    doc_ref = db.collection("comments").document()
    doc = {
        "post_id": post_id,
        "author_uid": user["id"],
        "author_name": user["name"],
        "content": payload.content,
        "created_at": utcnow(),
    }
    await doc_ref.set(doc)

    await post_ref.update({"comment_count": Increment(1)})

    return {"id": doc_ref.id, "message": "Comment added"}


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    comment_ref = db.collection("comments").document(comment_id)
    comment_doc = await comment_ref.get()
    if not comment_doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comment_doc.to_dict() or {}
    is_author = comment.get("author_uid") == user["id"]
    is_admin = user.get("role") == "admin"
    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    await comment_ref.delete()

    post_id = comment.get("post_id")
    if post_id:
        post_ref = db.collection("posts").document(post_id)
        await post_ref.update({"comment_count": Increment(-1)})

    return {"message": "Comment deleted"}
