"""Seed Firestore with baseline data."""

from __future__ import annotations

import asyncio
import os
import sys

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from app.database import close_db, connect_db, get_db
from app.utils.helpers import utcnow


def _strip_id(item: dict) -> dict:
    doc = dict(item)
    doc.pop("id", None)
    return doc


async def _upsert(collection_name: str, items: list[dict]) -> None:
    db = get_db()
    for item in items:
        doc_id = item["id"]
        doc = _strip_id(item)
        await db.collection(collection_name).document(doc_id).set(doc, merge=True)


async def seed() -> None:
    await connect_db()
    now = utcnow()

    note_categories = [
        {"id": "nc1", "name": "Mathematics", "created_at": now},
        {"id": "nc2", "name": "Physics", "created_at": now},
    ]
    note_subcategories = [
        {"id": "ns1", "category_id": "nc1", "name": "Calculus", "created_at": now},
        {"id": "ns2", "category_id": "nc1", "name": "Algebra", "created_at": now},
        {"id": "ns3", "category_id": "nc2", "name": "Mechanics", "created_at": now},
    ]
    notes = [
        {"id": "n1", "subcategory_id": "ns1", "title": "Limits & Continuity", "drive_link": "https://drive.google.com/file/d/example1", "uploaded_by": "seed", "created_at": now},
        {"id": "n2", "subcategory_id": "ns2", "title": "Quadratic Equations", "drive_link": "https://drive.google.com/file/d/example2", "uploaded_by": "seed", "created_at": now},
        {"id": "n3", "subcategory_id": "cat-nc1", "title": "General Math Notes", "drive_link": "https://drive.google.com/file/d/example3", "uploaded_by": "seed", "created_at": now},
    ]

    video_categories = [
        {"id": "vc1", "name": "Mathematics", "created_at": now},
        {"id": "vc2", "name": "Physics", "created_at": now},
    ]
    video_subcategories = [
        {"id": "vs1", "category_id": "vc1", "name": "Calculus", "created_at": now},
        {"id": "vs2", "category_id": "vc2", "name": "Mechanics", "created_at": now},
    ]
    video_links = [
        {"id": "v1", "subcategory_id": "vs1", "title": "Intro to Limits", "youtube_link": "https://www.youtube.com/watch?v=riXcZT2ICjA", "uploaded_by": "seed", "created_at": now},
        {"id": "v2", "subcategory_id": "cat-vc2", "title": "Physics Overview", "youtube_link": "https://www.youtube.com/watch?v=kKKM8Y-u7ds", "uploaded_by": "seed", "created_at": now},
    ]

    circulars = [
        {"id": "c1", "title": "Mid-Term Schedule", "description": "Mid-term exams start next week.", "attachment_link": None, "posted_by": "seed", "date": now.strftime("%Y-%m-%d"), "created_at": now},
        {"id": "c2", "title": "Holiday Notice", "description": "Campus closed this Friday.", "attachment_link": None, "posted_by": "seed", "date": now.strftime("%Y-%m-%d"), "created_at": now},
    ]

    mentorship_categories = [
        {"id": "mc1", "name": "Blood Group", "created_at": now},
        {"id": "mc2", "name": "Address", "created_at": now},
        {"id": "mc3", "name": "Parent Contact", "created_at": now},
    ]
    mentees = [
        {"id": "ms1", "name": "Aarav Sharma", "email": "aarav@example.com", "phone": "9876543210", "marks_sheet_link": "https://docs.google.com/spreadsheets/d/example1", "category_values": {"mc1": "O+", "mc2": "Delhi", "mc3": "9876500001"}, "managed_by": "seed", "created_at": now, "updated_at": now},
        {"id": "ms2", "name": "Priya Patel", "email": "priya@example.com", "phone": "9876543211", "marks_sheet_link": None, "category_values": {"mc1": "A+", "mc2": "Mumbai", "mc3": "9876500002"}, "managed_by": "seed", "created_at": now, "updated_at": now},
    ]

    posts = [
        {"id": "p1", "author_uid": "seed", "author_name": "Seed Admin", "author_avatar": None, "content": "Welcome to the community!", "image_url": None, "likes": [], "comment_count": 2, "created_at": now},
        {"id": "p2", "author_uid": "seed", "author_name": "Seed Admin", "author_avatar": None, "content": "Share your study tips here.", "image_url": None, "likes": [], "comment_count": 0, "created_at": now},
    ]
    comments = [
        {"id": "cm1", "post_id": "p1", "author_uid": "seed", "author_name": "Seed Admin", "content": "First comment!", "created_at": now},
        {"id": "cm2", "post_id": "p1", "author_uid": "seed", "author_name": "Seed Admin", "content": "Second comment.", "created_at": now},
    ]

    await _upsert("note_categories", note_categories)
    await _upsert("note_subcategories", note_subcategories)
    await _upsert("notes", notes)
    await _upsert("video_categories", video_categories)
    await _upsert("video_subcategories", video_subcategories)
    await _upsert("video_links", video_links)
    await _upsert("circulars", circulars)
    await _upsert("mentorship_categories", mentorship_categories)
    await _upsert("mentee_students", mentees)
    await _upsert("posts", posts)
    await _upsert("comments", comments)

    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
