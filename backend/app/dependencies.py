"""Auth dependencies — Firebase token verification and role guards.

When DEV_AUTH_MODE is enabled, Firebase is bypassed entirely.
Instead, pass ``X-Dev-User-Id: <user_id_string>`` header to authenticate
as any user in the Firestore users collection.
"""

import asyncio
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import get_db
from app.utils.helpers import serialize_doc, utcnow

logger = logging.getLogger("teachlearn.auth")

oauth2_scheme = HTTPBearer(auto_error=False)

# Lazy-init firebase admin
_firebase_app_initialized = False


def _init_firebase() -> None:
    global _firebase_app_initialized
    if _firebase_app_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
        import json
        import base64

        if settings.firebase_credentials_json:
            try:
                creds_dict = json.loads(base64.b64decode(settings.firebase_credentials_json).decode("utf-8"))
            except Exception:
                creds_dict = json.loads(settings.firebase_credentials_json)
            cred = credentials.Certificate(creds_dict)
        else:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            
        firebase_admin.initialize_app(cred)
        _firebase_app_initialized = True
        logger.info("Firebase Admin SDK initialized")
    except Exception as exc:
        raise RuntimeError(f"Failed to initialize Firebase admin: {exc}")


def _is_admin_email(email: str | None) -> bool:
    if not email:
        return False
    return email.lower() in settings.admin_email_list


async def _get_user_by_email(db, email: str) -> dict | None:
    query = db.collection("users").where("email", "==", email).limit(1)
    docs = [doc async for doc in query.stream()]
    if not docs:
        return None
    return serialize_doc(docs[0])


def _verify_token_sync(token_str: str) -> dict:
    """Verify Firebase ID token — runs in thread pool because it's blocking I/O."""
    from firebase_admin import auth as fb_auth
    return fb_auth.verify_id_token(token_str)


async def get_current_user(
    request: Request,
    token: HTTPAuthorizationCredentials | None = Depends(oauth2_scheme),
) -> dict:
    """Return the current user document from Firestore.

    In dev mode, reads ``X-Dev-User-Id`` header instead of Firebase token.
    """
    db = get_db()
    users_ref = db.collection("users")

    # ── Dev auth mode ──────────────────────────────────────
    if settings.dev_auth_mode:
        dev_user_id = request.headers.get("X-Dev-User-Id")
        if not dev_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Dev mode: provide X-Dev-User-Id header",
            )
        user = None
        doc = await users_ref.document(dev_user_id).get()
        if doc.exists:
            user = serialize_doc(doc)
        if not user:
            user = await _get_user_by_email(db, dev_user_id)
        if not user:
            query = users_ref.where("firebase_uid", "==", dev_user_id).limit(1)
            docs = [doc async for doc in query.stream()]
            if docs:
                user = serialize_doc(docs[0])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Dev mode: no user found for '{dev_user_id}'",
            )
        role = "admin" if _is_admin_email(user.get("email")) else "student"
        if user.get("role") != role:
            await users_ref.document(user["id"]).update({"role": role, "updated_at": utcnow()})
            user["role"] = role
        return user

    # ── Firebase auth mode ─────────────────────────────────
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    _init_firebase()
    logger.info("Verifying Firebase token...")

    try:
        # Run verify_id_token in a thread pool so it doesn't block the async event loop
        loop = asyncio.get_event_loop()
        decoded = await asyncio.wait_for(
            loop.run_in_executor(None, _verify_token_sync, token.credentials),
            timeout=10.0,
        )
        logger.info("Token verified successfully")
    except asyncio.TimeoutError:
        logger.error("Token verification timed out after 10s")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification timed out — try again",
        )
    except Exception as exc:
        logger.error(f"Token verification failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing uid",
        )
    email = decoded.get("email")
    role = "admin" if _is_admin_email(email) else "student"

    doc_ref = users_ref.document(uid)
    doc = await doc_ref.get()
    if doc.exists:
        user = serialize_doc(doc)
        updates = {}
        if email and user.get("email") != email:
            updates["email"] = email
        if user.get("role") != role:
            updates["role"] = role
        if updates:
            updates["updated_at"] = utcnow()
            await doc_ref.update(updates)
            user.update(updates)
        return user

    user = {
        "firebase_uid": uid,
        "name": decoded.get("name") or (email or ""),
        "email": email or "",
        "phone": decoded.get("phone_number") or "",
        "role": role,
        "profile_picture_url": decoded.get("picture"),
        "created_at": utcnow(),
        "updated_at": utcnow(),
    }
    await doc_ref.set(user)
    user["id"] = uid
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Guard: only allow admin users."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
