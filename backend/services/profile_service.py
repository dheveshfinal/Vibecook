import os
import asyncpg
import uuid
import shutil
from pathlib import Path
from typing import Optional, List
from schemas.profile_schema import ProfileUpdate

from core.config import DATABASE_URL, BASE_URL, AVATARS_DIR

class ProfileService:
    @staticmethod
    async def get_profile(pool: asyncpg.Pool, user_id: str) -> Optional[dict]:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id=$1::uuid", user_id)
            if not row:
                return None
            data = dict(row)
            data["avatar_url"] = f"{BASE_URL}/static/{data['avatar_path']}" if data["avatar_path"] else ""
            return data

    @staticmethod
    async def get_first_profile(pool: asyncpg.Pool) -> Optional[dict]:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users ORDER BY member_since LIMIT 1")
            if not row:
                return None
            data = dict(row)
            data["avatar_url"] = f"{BASE_URL}/static/{data['avatar_path']}" if data["avatar_path"] else ""
            return data

    @staticmethod
    async def update_profile(pool: asyncpg.Pool, user_id: str, body: ProfileUpdate):
        async with pool.acquire() as conn:
            updates = body.dict(exclude_none=True)
            if not updates:
                return
            set_clause = ", ".join(f"{k}=${i+2}" for i, k in enumerate(updates))
            vals = list(updates.values())
            await conn.execute(
                f"UPDATE users SET {set_clause} WHERE id=$1::uuid",
                user_id, *vals
            )

    @staticmethod
    async def upload_avatar(pool: asyncpg.Pool, file_content, filename: str) -> str:
        ext = Path(filename).suffix or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        dest = AVATARS_DIR / unique_name

        with dest.open("wb") as f:
            f.write(file_content)

        rel_path = f"avatars/{unique_name}"
        url = f"{BASE_URL}/static/{rel_path}"

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET avatar_path=$1 WHERE id=(SELECT id FROM users ORDER BY member_since LIMIT 1)",
                rel_path
            )
        return url
