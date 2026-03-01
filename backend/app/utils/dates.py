from datetime import date, datetime, time
from math import ceil

from fastapi import HTTPException, status


def validate_range(start_date: date, end_date: date) -> None:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be on or after start_date",
        )


def rental_days(start_date: date, end_date: date) -> int:
    return (end_date - start_date).days + 1


def ranges_overlap(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    return max(a_start, b_start) <= min(a_end, b_end)


def validate_datetime_range(start_datetime: datetime, end_datetime: datetime) -> None:
    if end_datetime <= start_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_datetime must be after start_datetime",
        )


def datetimes_overlap(
    a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime
) -> bool:
    return max(a_start, b_start) < min(a_end, b_end)


def rental_days_from_datetimes(start_datetime: datetime, end_datetime: datetime) -> int:
    duration_seconds = (end_datetime - start_datetime).total_seconds()
    return max(1, ceil(duration_seconds / 86400))


def normalize_slot_to_datetimes(slot: dict) -> tuple[datetime, datetime]:
    if slot.get("start_datetime") and slot.get("end_datetime"):
        return (
            datetime.fromisoformat(slot["start_datetime"]),
            datetime.fromisoformat(slot["end_datetime"]),
        )

    # Backward compatibility with old date-only slots.
    if slot.get("start_date") and slot.get("end_date"):
        start_date = date.fromisoformat(slot["start_date"])
        end_date = date.fromisoformat(slot["end_date"])
        return (
            datetime.combine(start_date, time.min),
            datetime.combine(end_date, time.max.replace(microsecond=0)),
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid availability slot format",
    )


def normalize_booking_to_datetimes(booking: dict) -> tuple[datetime, datetime]:
    if booking.get("start_datetime") and booking.get("end_datetime"):
        return (
            datetime.fromisoformat(booking["start_datetime"]),
            datetime.fromisoformat(booking["end_datetime"]),
        )

    # Backward compatibility with old date-only bookings.
    if booking.get("start_date") and booking.get("end_date"):
        start_date = date.fromisoformat(booking["start_date"])
        end_date = date.fromisoformat(booking["end_date"])
        return (
            datetime.combine(start_date, time.min),
            datetime.combine(end_date, time.max.replace(microsecond=0)),
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid booking range format",
    )
