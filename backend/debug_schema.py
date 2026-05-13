import asyncpg
import asyncio
import os
from dotenv import load_dotenv

# Try to find .env or use defaults
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chef_user:chef_pass@localhost:5435/chefai")

async def check_db():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected to DB")
        
        # Check users columns
        rows = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        cols = [r['column_name'] for r in rows]
        print(f"Users columns: {cols}")
        
        if "username" not in cols:
            print("Adding username column...")
            await conn.execute("ALTER TABLE users ADD COLUMN username VARCHAR(80) UNIQUE DEFAULT 'food_explorer'")
            print("Done.")
        else:
            print("Username column exists.")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
