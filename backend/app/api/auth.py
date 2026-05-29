"""
Authentication API endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.db.database import get_database
from app.schemas.auth import (
    AuthResponse,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetResponse,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserOut:
    if not credentials or not credentials.scheme.lower() == "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

    token = credentials.credentials
    try:
        payload = AuthService.decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    db = await get_database()
    user_doc = await AuthService.find_user_by_id(db, user_id)
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return UserOut(**AuthService.user_out(user_doc))


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: UserCreate) -> AuthResponse:
    db = await get_database()
    email = payload.email.lower()
    existing = await AuthService.find_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = AuthService.hash_password(payload.password)
    user_doc = AuthService.build_user_doc(email=email, name=payload.name, password_hash=password_hash)
    await db.users.insert_one(user_doc)

    tokens = await AuthService.issue_tokens(db, user_doc)
    return AuthResponse(user=UserOut(**AuthService.user_out(user_doc)), tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin) -> AuthResponse:
    db = await get_database()
    email = payload.email.lower()
    user_doc = await AuthService.find_user_by_email(db, email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not AuthService.verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    tokens = await AuthService.issue_tokens(db, user_doc)
    return AuthResponse(user=UserOut(**AuthService.user_out(user_doc)), tokens=tokens)


@router.post("/logout")
async def logout(payload: LogoutRequest) -> dict:
    if payload.refresh_token:
        db = await get_database()
        await AuthService.revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user


@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(payload: PasswordResetRequest) -> PasswordResetResponse:
    db = await get_database()
    email = payload.email.lower()
    user_doc = await AuthService.find_user_by_email(db, email)
    if not user_doc:
        return PasswordResetResponse(message="If the account exists, a reset link has been created.")

    reset_token = await AuthService.create_password_reset(db, user_doc["_id"])
    # Return the token for now to support local dev and tests.
    return PasswordResetResponse(message="Password reset token created.", reset_token=reset_token)


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(payload: PasswordResetConfirm) -> PasswordResetResponse:
    db = await get_database()
    reset_doc = await AuthService.consume_password_reset(db, payload.reset_token)
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    new_hash = AuthService.hash_password(payload.new_password)
    await db.users.update_one(
        {"_id": reset_doc["user_id"]},
        {"$set": {"password_hash": new_hash}},
    )

    return PasswordResetResponse(message="Password updated successfully.")
