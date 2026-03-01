from fastapi import APIRouter, Depends

from app.deps.auth import get_current_user
from app.db.mongodb import get_db
from app.utils.dates import normalize_slot_to_datetimes
from app.utils.mongo import serialize_doc, to_object_id

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/me")
async def dashboard_me(current_user=Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    listed_pets = []
    async for pet in db.pets.find({"owner_id": user_id}):
        pet_out = serialize_doc(pet)
        normalized_slots = []
        for slot in pet_out.get("availability_slots", []):
            try:
                start_dt, end_dt = normalize_slot_to_datetimes(slot)
                normalized_slots.append(
                    {
                        "start_datetime": start_dt.isoformat(),
                        "end_datetime": end_dt.isoformat(),
                    }
                )
            except Exception:
                continue
        pet_out["availability_slots"] = normalized_slots
        if "bookings_enabled" not in pet_out:
            pet_out["bookings_enabled"] = True
        listed_pets.append(pet_out)

    owner_pet_map = {pet["id"]: pet for pet in listed_pets}
    received_bookings = []
    async for booking in db.bookings.find({"pet_id": {"$in": list(owner_pet_map.keys())}}):
        borrower = await db.users.find_one({"_id": to_object_id(booking["borrower_id"])})
        pet = owner_pet_map.get(booking["pet_id"])
        received_bookings.append(
            {
                "id": str(booking["_id"]),
                "pet_id": booking.get("pet_id"),
                "pet_name": pet.get("name") if pet else None,
                "borrower_name": booking.get("full_name")
                or (borrower.get("name") if borrower else None),
                "borrower_email": borrower.get("email") if borrower else None,
                "borrower_phone": booking.get("phone_number"),
                "borrower_address": booking.get("pickup_address"),
                "start_datetime": booking.get("start_datetime"),
                "end_datetime": booking.get("end_datetime"),
                "booking_status": booking.get("status"),
                "total_amount": booking.get("total_amount"),
            }
        )

    my_bookings = []
    async for booking in db.bookings.find({"borrower_id": user_id}):
        pet = None
        owner = None
        pet_id = booking.get("pet_id")
        if isinstance(pet_id, str):
            try:
                pet = await db.pets.find_one({"_id": to_object_id(pet_id)})
                if pet and pet.get("owner_id"):
                    owner = await db.users.find_one({"_id": to_object_id(pet["owner_id"])})
            except Exception:
                pet = None
                owner = None

        my_bookings.append(
            {
                "id": str(booking["_id"]),
                "pet_id": pet_id,
                "pet_name": pet.get("name") if pet else None,
                "pet_type": pet.get("type") if pet else None,
                "owner_name": owner.get("name") if owner else None,
                "owner_email": owner.get("email") if owner else None,
                "start_datetime": booking.get("start_datetime"),
                "end_datetime": booking.get("end_datetime"),
                "booking_status": booking.get("status"),
                "total_amount": booking.get("total_amount"),
            }
        )

    return {
        "lender": {
            "listed_pets": listed_pets,
            "received_bookings": received_bookings,
        },
        "borrower": {
            "my_bookings": my_bookings,
        },
    }
