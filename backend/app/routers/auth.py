import random
from datetime import timedelta

from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongodb import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.utils.mongo import now_utc, serialize_doc

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
        )

    user_doc = {
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "created_at": now_utc(),
    }
    result = await db.users.insert_one(user_doc)
    created = await db.users.find_one({"_id": result.inserted_id})
    return UserOut(**serialize_doc(created))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token(str(user["_id"]))
    return TokenResponse(access_token=token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email not found"
        )

    otp = f"{random.randint(0, 999999):06d}"
    expires_at = now_utc() + timedelta(minutes=10)

    await db.password_resets.update_one(
        {"email": payload.email.lower()},
        {
            "$set": {
                "email": payload.email.lower(),
                "otp": otp,
                "expires_at": expires_at,
                "used": False,
                "updated_at": now_utc(),
            }
        },
        upsert=True,
    )

    print(f"[OTP MOCK] Password reset OTP for {payload.email.lower()}: {otp}")
    return {"message": "OTP sent to your email (mocked in server console)."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    db = get_db()
    email = payload.email.lower()

    reset_entry = await db.password_resets.find_one(
        {"email": email, "otp": payload.otp, "used": False}
    )
    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP"
        )

    expires_at = reset_entry.get("expires_at")
    if not expires_at or expires_at < now_utc():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired"
        )

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email not found"
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    await db.password_resets.update_one(
        {"_id": reset_entry["_id"]},
        {"$set": {"used": True, "used_at": now_utc()}},
    )

    return {"message": "Password reset successful."}
