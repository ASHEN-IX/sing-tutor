"""
Authentication helpers: password hashing, JWT tokens, and session tracking.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ALGORITHM,
    JWT_SECRET,
    PASSWORD_RESET_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return pwd_context.verify(password, password_hash)

    @staticmethod
    def create_access_token(user_id: str, email: str) -> Tuple[str, int]:
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "email": email,
            "iat": int(now.timestamp()),
            "exp": int(expires.timestamp()),
            "jti": str(uuid4()),
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token, int(expires.timestamp() - now.timestamp())

    @staticmethod
    def create_refresh_token() -> str:
        return secrets.token_urlsafe(48)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def build_user_doc(email: str, name: str, password_hash: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        return {
            "_id": str(uuid4()),
            "email": email,
            "name": name,
            "password_hash": password_hash,
            "avatar_url": None,
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def user_out(doc: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": doc["_id"],
            "email": doc["email"],
            "name": doc.get("name", ""),
            "avatar_url": doc.get("avatar_url"),
            "created_at": doc.get("created_at"),
        }

    @staticmethod
    async def issue_tokens(db, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        access_token, expires_in = AuthService.create_access_token(user_doc["_id"], user_doc["email"])
        refresh_token = AuthService.create_refresh_token()
        refresh_hash = AuthService.hash_token(refresh_token)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        await db.sessions.insert_one({
            "_id": str(uuid4()),
            "user_id": user_doc["_id"],
            "refresh_token_hash": refresh_hash,
            "created_at": now,
            "expires_at": expires_at,
            "revoked_at": None,
        })

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    @staticmethod
    async def revoke_refresh_token(db, refresh_token: str) -> bool:
        refresh_hash = AuthService.hash_token(refresh_token)
        now = datetime.now(timezone.utc)
        result = await db.sessions.update_one(
            {"refresh_token_hash": refresh_hash, "revoked_at": None},
            {"$set": {"revoked_at": now}},
        )
        return getattr(result, "modified_count", 0) > 0

    @staticmethod
    async def find_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]:
        return await db.users.find_one({"_id": user_id})

    @staticmethod
    async def find_user_by_email(db, email: str) -> Optional[Dict[str, Any]]:
        return await db.users.find_one({"email": email})

    @staticmethod
    def decode_access_token(token: str) -> Dict[str, Any]:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

    @staticmethod
    async def create_password_reset(db, user_id: str) -> str:
        reset_token = secrets.token_urlsafe(32)
        token_hash = AuthService.hash_token(reset_token)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES)

        await db.password_resets.insert_one({
            "_id": str(uuid4()),
            "user_id": user_id,
            "token_hash": token_hash,
            "created_at": now,
            "expires_at": expires_at,
            "used_at": None,
        })

        return reset_token

    @staticmethod
    async def consume_password_reset(db, reset_token: str) -> Optional[Dict[str, Any]]:
        token_hash = AuthService.hash_token(reset_token)
        now = datetime.now(timezone.utc)
        reset_doc = await db.password_resets.find_one({"token_hash": token_hash, "used_at": None})
        if not reset_doc:
            return None
        if reset_doc.get("expires_at") and reset_doc["expires_at"] < now:
            return None

        await db.password_resets.update_one(
            {"_id": reset_doc["_id"]},
            {"$set": {"used_at": now}},
        )
        return reset_doc
