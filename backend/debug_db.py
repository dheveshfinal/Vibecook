import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chef_user:chef_pass@postgres:5432/chefai")

async def check_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT id, title, created_at FROM recipes ORDER BY created_at DESC LIMIT 10")
        print("Latest Recipes:")
        for r in rows:
            print(f"ID: {r['id']} | Title: '{r['title']}' | Created At: {r['created_at']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_db())
