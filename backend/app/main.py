"""FastAPI application entry point."""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db

# Import routers
from app.routers import auth
from app.routers import categories
from app.routers import notes
from app.routers import video_categories
from app.routers import videos
from app.routers import circulars
from app.routers import mentorship
from app.routers import community
from app.routers import profile
from app.routers import dashboard
from app.routers import websocket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teachlearn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown: connect and disconnect Firestore."""
    await connect_db()
    logger.info("Firestore connected")
    yield
    await close_db()
    logger.info("Firestore disconnected")


app = FastAPI(
    title="TeachLearn API",
    description="Backend API for the Teacher Personal Learning Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging middleware ──────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    logger.info(f"← {request.method} {request.url.path} → {response.status_code} ({elapsed}ms)")
    return response


# ── Routers ─────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(auth.router, prefix=PREFIX)
app.include_router(categories.router, prefix=PREFIX)
app.include_router(notes.router, prefix=PREFIX)
app.include_router(video_categories.router, prefix=PREFIX)
app.include_router(videos.router, prefix=PREFIX)
app.include_router(circulars.router, prefix=PREFIX)
app.include_router(mentorship.router, prefix=PREFIX)
app.include_router(community.router, prefix=PREFIX)
app.include_router(profile.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)

# WebSockets don't necessarily need the /api/v1 prefix, but we'll include it or let the router define its own.
app.include_router(websocket.router)


# ── Health Check ────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "teachlearn-api"}
