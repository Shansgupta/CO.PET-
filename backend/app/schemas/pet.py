from datetime import datetime

from pydantic import BaseModel, Field


class AvailabilitySlot(BaseModel):
    start_datetime: datetime
    end_datetime: datetime


class PetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=50)
    breed: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    price_per_day: float = Field(gt=0)
    address: str = Field(min_length=3, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=3, max_length=20)
    image_url: str | None = Field(default=None, max_length=2_000_000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    availability_slots: list[AvailabilitySlot]


class PetBookingStatusUpdate(BaseModel):
    bookings_enabled: bool


class PetAvailabilityUpdate(BaseModel):
    availability_slots: list[AvailabilitySlot]


class PetOut(BaseModel):
    id: str
    owner_id: str
    name: str
    type: str
    breed: str
    description: str
    price_per_day: float
    address: str = ""
    city: str = ""
    postal_code: str = ""
    image_url: str | None = None
    bookings_enabled: bool = True
    latitude: float | None = None
    longitude: float | None = None
    distance_km: float | None = None
    availability_slots: list[AvailabilitySlot]
