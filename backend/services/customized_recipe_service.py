import asyncpg
from typing import List, Optional
from uuid import UUID
from schemas.recipe_schema import CustomizedRecipeCreate, CustomizedRecipeUpdate
from core.config import BASE_URL

class CustomizedRecipeService:
    @staticmethod
    async def save_customization(pool: asyncpg.Pool, user_id: str, recipe_id: str, body: CustomizedRecipeCreate) -> bool:
        async with pool.acquire() as conn:
            # Check if exists
            exists = await conn.fetchval(
                "SELECT id FROM customized_recipes WHERE user_id=$1::uuid AND original_recipe_id=$2::uuid",
                user_id, recipe_id
            )
            
            if exists:
                updates = body.dict(exclude_none=True)
                if not updates:
                    return True
                set_clause = ", ".join(f"{k}=${i+3}" for i, k in enumerate(updates))
                vals = list(updates.values())
                await conn.execute(
                    f"UPDATE customized_recipes SET {set_clause} WHERE user_id=$1::uuid AND original_recipe_id=$2::uuid",
                    user_id, recipe_id, *vals
                )
            else:
                await conn.execute("""
                    INSERT INTO customized_recipes (user_id, original_recipe_id, title, ingredients, steps, note)
                    VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
                """, user_id, recipe_id, body.title, body.ingredients, body.steps, body.note)
            return True

    @staticmethod
    async def get_customization(pool: asyncpg.Pool, user_id: str, recipe_id: str) -> Optional[dict]:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT cr.*, r.image_path, r.image_url, r.cuisine, r.time_mins, r.spice_level, r.diet_type
                FROM customized_recipes cr
                JOIN recipes r ON r.id = cr.original_recipe_id
                WHERE cr.user_id::text=$1 OR (SELECT username FROM users WHERE id=cr.user_id)=$1
                AND cr.original_recipe_id=$2::uuid
            """, str(user_id), recipe_id)
            if not row:
                return None
            data = dict(row)
            data["image_display_url"] = (
                f"{BASE_URL}/static/{data['image_path']}" if data["image_path"]
                else data.get("image_url", "")
            )
            return data

    @staticmethod
    async def get_all_customized_for_user(pool: asyncpg.Pool, user_id_or_username: str) -> List[dict]:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT cr.*, r.image_path, r.image_url, r.cuisine, r.time_mins, r.spice_level, r.diet_type
                FROM customized_recipes cr
                JOIN recipes r ON r.id = cr.original_recipe_id
                JOIN users u ON u.id = cr.user_id
                WHERE u.id::text=$1 OR u.username=$1
                ORDER BY cr.created_at DESC
            """, str(user_id_or_username))
            results = []
            for r in rows:
                d = dict(r)
                d["image_display_url"] = (
                    f"{BASE_URL}/static/{d['image_path']}" if d["image_path"]
                    else d.get("image_url", "")
                )
                results.append(d)
            return results
    @staticmethod
    async def delete_customization(pool: asyncpg.Pool, user_id: str, recipe_id: str) -> bool:
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM customized_recipes WHERE user_id=$1::uuid AND original_recipe_id=$2::uuid",
                user_id, recipe_id
            )
            return True
