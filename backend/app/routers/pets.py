from datetime import datetime
from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps.auth import get_current_user
from app.db.mongodb import get_db
from app.schemas.pet import (
    PetAvailabilityUpdate,
    PetBookingStatusUpdate,
    PetCreate,
    PetOut,
)
from app.utils.dates import (
    datetimes_overlap,
    normalize_booking_to_datetimes,
    normalize_slot_to_datetimes,
    validate_datetime_range,
)
from app.utils.mongo import serialize_doc, to_object_id

router = APIRouter(prefix="/pets", tags=["pets"])


async def ensure_geo_index(db) -> None:
    await db.pets.create_index([("location", "2dsphere")])


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    # Haversine distance
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    )
    return 2 * 6371 * asin(sqrt(a))


def normalize_pet_doc(pet: dict) -> dict:
    serialized = serialize_doc(pet)
    if not serialized.get("breed"):
        serialized["breed"] = "Unknown"
    if serialized.get("description") is None:
        serialized["description"] = ""
    if serialized.get("address") is None:
        serialized["address"] = ""
    if serialized.get("city") is None:
        serialized["city"] = ""
    if serialized.get("postal_code") is None:
        serialized["postal_code"] = ""
    if serialized.get("image_url") is None:
        serialized["image_url"] = None
    if "bookings_enabled" not in serialized:
        serialized["bookings_enabled"] = True
    if serialized.get("latitude") is None and isinstance(serialized.get("location"), dict):
        coords = serialized.get("location", {}).get("coordinates", [])
        if isinstance(coords, list) and len(coords) == 2:
            serialized["longitude"] = coords[0]
            serialized["latitude"] = coords[1]

    normalized_slots = []
    for slot in serialized.get("availability_slots", []):
        try:
            start_dt, end_dt = normalize_slot_to_datetimes(slot)
        except HTTPException:
            continue
        normalized_slots.append(
            {
                "start_datetime": start_dt.isoformat(),
                "end_datetime": end_dt.isoformat(),
            }
        )
    serialized["availability_slots"] = normalized_slots
    return serialized


@router.get("", response_model=list[PetOut])
async def list_pets(
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    radius_km: float = Query(default=5, gt=0),
    pet_type: str | None = Query(default=None),
    breed: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    available_from: datetime | None = Query(default=None),
    available_to: datetime | None = Query(default=None),
):
    db = get_db()
    await ensure_geo_index(db)
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price",
        )
    if available_from and available_to and available_to <= available_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="available_to must be after available_from",
        )
    if (lat is None) != (lng is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both lat and lng are required together",
        )

    query: dict = {}
    if pet_type:
        query["type"] = pet_type
    if breed:
        query["breed"] = breed
    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        query["price_per_day"] = price_filter

    pets = []
    async for pet in db.pets.find(query):
        normalized = normalize_pet_doc(pet)
        if available_from or available_to:
            requested_from = available_from or datetime.min
            requested_to = available_to or datetime.max
            has_overlap = False
            for slot in normalized.get("availability_slots", []):
                slot_start = datetime.fromisoformat(slot["start_datetime"])
                slot_end = datetime.fromisoformat(slot["end_datetime"])
                if datetimes_overlap(requested_from, requested_to, slot_start, slot_end):
                    has_overlap = True
                    break
            if not has_overlap:
                continue

        if lat is not None and lng is not None:
            pet_lat = normalized.get("latitude")
            pet_lng = normalized.get("longitude")
            if isinstance(pet_lat, (int, float)) and isinstance(pet_lng, (int, float)):
                km = distance_km(lat, lng, float(pet_lat), float(pet_lng))
                normalized["distance_km"] = round(km, 1)
                if km > radius_km:
                    continue
        pets.append(PetOut(**normalized))
    return pets


@router.get("/{pet_id}", response_model=PetOut)
async def get_pet(
    pet_id: str,
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
):
    if (lat is None) != (lng is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both lat and lng are required together",
        )
    db = get_db()
    pet = await db.pets.find_one({"_id": to_object_id(pet_id)})
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    normalized = normalize_pet_doc(pet)
    if lat is not None and lng is not None:
        pet_lat = normalized.get("latitude")
        pet_lng = normalized.get("longitude")
        if isinstance(pet_lat, (int, float)) and isinstance(pet_lng, (int, float)):
            normalized["distance_km"] = round(
                distance_km(lat, lng, float(pet_lat), float(pet_lng)), 1
            )
    return PetOut(**normalized)


@router.post("", response_model=PetOut, status_code=status.HTTP_201_CREATED)
async def create_pet(payload: PetCreate, current_user=Depends(get_current_user)):
    for slot in payload.availability_slots:
        validate_datetime_range(slot.start_datetime, slot.end_datetime)

    db = get_db()
    await ensure_geo_index(db)
    pet_doc = {
        "owner_id": str(current_user["_id"]),
        "name": payload.name.strip(),
        "type": payload.type.strip(),
        "breed": payload.breed.strip(),
        "description": payload.description.strip(),
        "price_per_day": payload.price_per_day,
        "address": payload.address.strip(),
        "city": payload.city.strip(),
        "postal_code": payload.postal_code.strip(),
        "image_url": payload.image_url,
        "bookings_enabled": True,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "availability_slots": [
            {
                "start_datetime": slot.start_datetime.isoformat(),
                "end_datetime": slot.end_datetime.isoformat(),
            }
            for slot in payload.availability_slots
        ],
    }
    if payload.latitude is not None and payload.longitude is not None:
        pet_doc["location"] = {
            "type": "Point",
            "coordinates": [payload.longitude, payload.latitude],
        }
    result = await db.pets.insert_one(pet_doc)
    created = await db.pets.find_one({"_id": result.inserted_id})
    return PetOut(**normalize_pet_doc(created))


@router.patch("/{pet_id}/booking-status", response_model=PetOut)
async def update_booking_status(
    pet_id: str,
    payload: PetBookingStatusUpdate,
    current_user=Depends(get_current_user),
):
    db = get_db()
    pet = await db.pets.find_one({"_id": to_object_id(pet_id)})
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if pet.get("owner_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the pet owner can update booking status",
        )

    if payload.bookings_enabled is False:
        now = datetime.utcnow()
        async for booking in db.bookings.find(
            {"pet_id": pet_id, "status": {"$in": ["confirmed", "active"]}}
        ):
            booking_start, booking_end = normalize_booking_to_datetimes(booking)
            if booking_end > now:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Booking cannot be disabled while a booked lending period "
                        "is still pending or active"
                    ),
                )

    await db.pets.update_one(
        {"_id": pet["_id"]},
        {"$set": {"bookings_enabled": payload.bookings_enabled}},
    )
    updated = await db.pets.find_one({"_id": pet["_id"]})
    return PetOut(**normalize_pet_doc(updated))


@router.patch("/{pet_id}/availability", response_model=PetOut)
async def update_availability(
    pet_id: str,
    payload: PetAvailabilityUpdate,
    current_user=Depends(get_current_user),
):
    for slot in payload.availability_slots:
        validate_datetime_range(slot.start_datetime, slot.end_datetime)

    db = get_db()
    pet = await db.pets.find_one({"_id": to_object_id(pet_id)})
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if pet.get("owner_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the pet owner can update availability",
        )

    slots = [
        {
            "start_datetime": slot.start_datetime.isoformat(),
            "end_datetime": slot.end_datetime.isoformat(),
        }
        for slot in payload.availability_slots
    ]

    await db.pets.update_one({"_id": pet["_id"]}, {"$set": {"availability_slots": slots}})
    updated = await db.pets.find_one({"_id": pet["_id"]})
    return PetOut(**normalize_pet_doc(updated))


@router.delete("/{pet_id}")
async def delete_pet(pet_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    pet = await db.pets.find_one({"_id": to_object_id(pet_id)})
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if pet.get("owner_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the pet owner can delete this pet",
        )

    await db.pets.delete_one({"_id": pet["_id"]})
    return {"message": "Pet removed"}
