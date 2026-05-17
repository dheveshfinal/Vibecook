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
    async def get_profile(pool: asyncpg.Pool, user_id: str, viewer_id: Optional[str] = None) -> Optional[dict]:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id::text=$1 OR username=$1", str(user_id))
            if not row:
                return None
            data = dict(row)
            data["avatar_url"] = f"{BASE_URL}/static/{data['avatar_path']}" if data["avatar_path"] else ""
            
            # Fetch saved recipe IDs
            saved_ids = await conn.fetch("SELECT recipe_id FROM saved_recipes WHERE user_id=$1", data["id"])
            data["recipes_saved_ids"] = [str(r["recipe_id"]) for r in saved_ids]

            # Follow stats
            followers = await conn.fetchval("SELECT COUNT(*) FROM follows WHERE followed_id=$1", data["id"])
            following = await conn.fetchval("SELECT COUNT(*) FROM follows WHERE follower_id=$1", data["id"])
            data["followers_count"] = followers
            data["following_count"] = following

            # Is following (relative to viewer)
            if viewer_id:
                is_following = await conn.fetchval(
                    "SELECT 1 FROM follows WHERE follower_id=$1::uuid AND followed_id=$2::uuid",
                    viewer_id, data["id"]
                )
                data["is_following"] = bool(is_following)
            else:
                data["is_following"] = False
            
            return data

    @staticmethod
    async def follow_user(pool: asyncpg.Pool, follower_id: str, followed_id: str):
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO follows (follower_id, followed_id) VALUES ($1::uuid, $2::uuid) ON CONFLICT DO NOTHING",
                follower_id, followed_id
            )

    @staticmethod
    async def unfollow_user(pool: asyncpg.Pool, follower_id: str, followed_id: str):
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM follows WHERE follower_id=$1::uuid AND followed_id=$2::uuid",
                follower_id, followed_id
            )

    @staticmethod
    async def get_followers(pool: asyncpg.Pool, user_id_or_username: str) -> List[dict]:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT u.id, u.username, u.display_name, u.avatar_path
                FROM follows f
                JOIN users u ON u.id = f.follower_id
                JOIN users target ON target.id = f.followed_id
                WHERE target.id::text=$1 OR target.username=$1
            """, str(user_id_or_username))
            results = []
            for r in rows:
                d = dict(r)
                d["avatar_url"] = f"{BASE_URL}/static/{d['avatar_path']}" if d["avatar_path"] else ""
                results.append(d)
            return results

    @staticmethod
    async def get_following(pool: asyncpg.Pool, user_id_or_username: str) -> List[dict]:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT u.id, u.username, u.display_name, u.avatar_path
                FROM follows f
                JOIN users u ON u.id = f.followed_id
                JOIN users source ON source.id = f.follower_id
                WHERE source.id::text=$1 OR source.username=$1
            """, str(user_id_or_username))
            results = []
            for r in rows:
                d = dict(r)
                d["avatar_url"] = f"{BASE_URL}/static/{d['avatar_path']}" if d["avatar_path"] else ""
                results.append(d)
            return results

    @staticmethod
    async def search_users(pool: asyncpg.Pool, username: str) -> List[dict]:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, username, display_name, avatar_path FROM users WHERE username ILIKE $1 OR display_name ILIKE $1 LIMIT 10",
                f"%{username}%"
            )
            results = []
            for r in rows:
                d = dict(r)
                d["avatar_url"] = f"{BASE_URL}/static/{d['avatar_path']}" if d["avatar_path"] else ""
                results.append(d)
            return results


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
    async def upload_avatar(pool: asyncpg.Pool, file_content, filename: str, user_id: str) -> str:
        ext = Path(filename).suffix or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        dest = AVATARS_DIR / unique_name

        with dest.open("wb") as f:
            f.write(file_content)

        rel_path = f"avatars/{unique_name}"
        url = f"{BASE_URL}/static/{rel_path}"

        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET avatar_path=$1 WHERE id=$2::uuid",
                rel_path, user_id
            )
        return url
