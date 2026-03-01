from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.payment import PaymentOut


class BookingCreate(BaseModel):
    pet_id: str
    start_datetime: datetime
    end_datetime: datetime
    full_name: str = Field(min_length=2, max_length=120)
    phone_number: str = Field(min_length=6, max_length=30)
    pickup_address: str = Field(min_length=5, max_length=300)


class BookingOut(BaseModel):
    id: str
    pet_id: str
    borrower_id: str
    start_datetime: datetime
    end_datetime: datetime
    full_name: str
    phone_number: str
    pickup_address: str
    total_amount: float
    status: str
    payment: PaymentOut
