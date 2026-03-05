from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import get_current_user
from app.db.mongodb import get_db
from app.utils.mongo import serialize_doc, to_object_id

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = Query(default=False),
    current_user=Depends(get_current_user),
):
    db = get_db()
    query: dict = {"user_id": str(current_user["_id"])}
    if unread_only:
        query["is_read"] = False

    notifications = []
    cursor = db.notifications.find(query).sort("created_at", -1).limit(100)
    async for doc in cursor:
        notifications.append(serialize_doc(doc))
    return notifications


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    notification = await db.notifications.find_one({"_id": to_object_id(notification_id)})
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    if notification.get("user_id") != str(current_user["_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    await db.notifications.update_one(
        {"_id": notification["_id"]},
        {"$set": {"is_read": True}},
    )
    updated = await db.notifications.find_one({"_id": notification["_id"]})
    return serialize_doc(updated)
