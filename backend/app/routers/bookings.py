from fastapi import APIRouter, Depends, HTTPException, status

from app.deps.auth import get_current_user
from app.db.mongodb import get_db
from app.schemas.booking import BookingCreate, BookingOut
from app.schemas.payment import PaymentOut
from app.services.payment import simulate_payment
from app.utils.dates import (
    datetimes_overlap,
    normalize_booking_to_datetimes,
    normalize_slot_to_datetimes,
    rental_days_from_datetimes,
    validate_datetime_range,
)
from app.utils.mongo import serialize_doc, to_object_id

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, current_user=Depends(get_current_user)):
    validate_datetime_range(payload.start_datetime, payload.end_datetime)
    db = get_db()

    pet = await db.pets.find_one({"_id": to_object_id(payload.pet_id)})
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if pet.get("bookings_enabled", True) is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is currently disabled for this pet",
        )
    if pet["owner_id"] == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book your own pet",
        )

    requested_start = payload.start_datetime
    requested_end = payload.end_datetime
    requested_slot = {
        "start_datetime": requested_start.isoformat(),
        "end_datetime": requested_end.isoformat(),
    }
    normalized_pet_slots = []
    slot_exists = False
    for slot in pet.get("availability_slots", []):
        slot_start, slot_end = normalize_slot_to_datetimes(slot)
        normalized = {
            "start_datetime": slot_start.isoformat(),
            "end_datetime": slot_end.isoformat(),
        }
        normalized_pet_slots.append(normalized)
        if slot_start == requested_start and slot_end == requested_end:
            slot_exists = True
    if not slot_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested slot is not available",
        )

    conflicts = []
    async for booking in db.bookings.find(
        {"pet_id": payload.pet_id, "status": {"$in": ["confirmed", "active"]}}
    ):
        booking_start, booking_end = normalize_booking_to_datetimes(booking)
        if datetimes_overlap(
            requested_start,
            requested_end,
            booking_start,
            booking_end,
        ):
            conflicts.append(booking)
            break

    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This pet is already booked for the selected range",
        )

    days = rental_days_from_datetimes(requested_start, requested_end)
    total_amount = round(days * pet["price_per_day"], 2)

    booking_doc = {
        "pet_id": payload.pet_id,
        "borrower_id": str(current_user["_id"]),
        "start_datetime": requested_start.isoformat(),
        "end_datetime": requested_end.isoformat(),
        "full_name": payload.full_name.strip(),
        "phone_number": payload.phone_number.strip(),
        "pickup_address": payload.pickup_address.strip(),
        "start_date": requested_start.date().isoformat(),
        "end_date": requested_end.date().isoformat(),
        "total_amount": total_amount,
        "status": "confirmed",
    }
    booking_result = await db.bookings.insert_one(booking_doc)
    booking_id = str(booking_result.inserted_id)

    payment_calc = simulate_payment(total_amount)
    payment_doc = {"booking_id": booking_id, **payment_calc}
    await db.payments.insert_one(payment_doc)

    if normalized_pet_slots != pet.get("availability_slots", []):
        await db.pets.update_one(
            {"_id": pet["_id"]},
            {"$set": {"availability_slots": normalized_pet_slots}},
        )
    await db.pets.update_one({"_id": pet["_id"]}, {"$pull": {"availability_slots": requested_slot}})

    booking = await db.bookings.find_one({"_id": booking_result.inserted_id})
    booking_out = serialize_doc(booking)
    booking_out["payment"] = PaymentOut(**payment_doc)
    return BookingOut(**booking_out)
