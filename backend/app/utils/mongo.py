from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid id format"
        )
    return ObjectId(value)


def serialize_doc(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc
