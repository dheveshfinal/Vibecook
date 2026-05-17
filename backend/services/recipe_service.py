import os
import asyncpg
from typing import List, Optional
from uuid import UUID
from schemas.recipe_schema import RecipeCreate, RecipeUpdate

from core.config import DATABASE_URL, BASE_URL

class RecipeService:
    @staticmethod
    async def list_recipes(pool: asyncpg.Pool, diet: Optional[str] = None, spice: Optional[str] = None, search: Optional[str] = None) -> List[dict]:
        async with pool.acquire() as conn:
            query = "SELECT * FROM recipes WHERE diet_type != 'KnowledgeBase'"
            params = []
            if diet:
                params.append(diet)
                query += f" AND diet_type=${len(params)}"
            if spice:
                params.append(spice)
                query += f" AND spice_level=${len(params)}"
            if search:
                params.append(f"%{search}%")
                query += f" AND (title ILIKE ${len(params)} OR cuisine ILIKE ${len(params)} OR description ILIKE ${len(params)})"
            
            query += " ORDER BY created_at DESC"
            rows = await conn.fetch(query, *params)
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
    async def get_recipe(pool: asyncpg.Pool, recipe_id: str) -> Optional[dict]:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM recipes WHERE id=$1::uuid", recipe_id)
            if not row:
                return None
            data = dict(row)
            data["image_display_url"] = (
                f"{BASE_URL}/static/{data['image_path']}" if data["image_path"]
                else data.get("image_url", "")
            )
            data["ingredients_list"] = data.get("ingredients", "").split("\n") if data.get("ingredients") else []
            data["steps_list"] = data.get("steps", "").split("\n") if data.get("steps") else []
            return data

    @staticmethod
    async def create_recipe(pool: asyncpg.Pool, body: RecipeCreate) -> str:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO recipes (title, image_url, cuisine, time_mins, spice_level, diet_type)
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
            """, body.title, body.image_url, body.cuisine,
                 body.time_mins, body.spice_level, body.diet_type)
            return str(row["id"])

    @staticmethod
    async def update_recipe(pool: asyncpg.Pool, recipe_id: str, body: RecipeUpdate) -> bool:
        async with pool.acquire() as conn:
            updates = body.dict(exclude_none=True)
            if not updates:
                return False
            set_clause = ", ".join(f"{k}=${i+2}" for i, k in enumerate(updates))
            vals = list(updates.values())
            await conn.execute(
                f"UPDATE recipes SET {set_clause} WHERE id=$1::uuid",
                recipe_id, *vals
            )
            return True

    @staticmethod
    async def delete_recipe(pool: asyncpg.Pool, recipe_id: str):
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM saved_recipes WHERE recipe_id=$1::uuid", recipe_id)
            await conn.execute("DELETE FROM recipes WHERE id=$1::uuid", recipe_id)

    @staticmethod
    async def get_saved_recipes(pool: asyncpg.Pool, user_id: str) -> List[dict]:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT r.*, sr.saved_at
                FROM saved_recipes sr
                JOIN recipes r ON r.id = sr.recipe_id
                JOIN users u ON u.id = sr.user_id
                WHERE u.id::text=$1 OR u.username=$1
                ORDER BY sr.saved_at DESC
            """, str(user_id))
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
    async def save_recipe(pool: asyncpg.Pool, user_id: str, recipe_id: str):
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO saved_recipes (user_id, recipe_id)
                VALUES ($1::uuid, $2::uuid)
                ON CONFLICT DO NOTHING
            """, user_id, recipe_id)
            await conn.execute(
                "UPDATE users SET recipes_saved = recipes_saved + 1 WHERE id=$1::uuid",
                user_id
            )

    @staticmethod
    async def unsave_recipe(pool: asyncpg.Pool, user_id: str, recipe_id: str):
        async with pool.acquire() as conn:
            await conn.execute("""
                DELETE FROM saved_recipes WHERE user_id=$1::uuid AND recipe_id=$2::uuid
            """, user_id, recipe_id)
            await conn.execute(
                "UPDATE users SET recipes_saved = GREATEST(0, recipes_saved - 1) WHERE id=$1::uuid",
                user_id
            )
