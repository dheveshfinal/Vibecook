import os
import asyncpg
import redis.asyncio as aioredis
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio

# Modular Routers
from api.v1.endpoints.monitor import router as monitor_router
from api.v1.endpoints.recipes import router as recipes_router
from api.v1.endpoints.profile import router as profile_router
from api.v1.endpoints.chat import router as chat_router

# Database Models
from models import (
    CREATE_USERS_TABLE,
    CREATE_RECIPES_TABLE,
    CREATE_SAVED_RECIPES_TABLE,
    CREATE_CHAT_HISTORY_TABLE,
    CREATE_DOCUMENTS_TABLE,
    CREATE_TASK_LOGS_TABLE,
    SEED_ADMIN_USER,
)

from core.config import DATABASE_URL, REDIS_URL, UPLOAD_DIR, DOCS_DIR

app = FastAPI(title="ChefAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include Modular Routers
app.include_router(monitor_router, prefix="/api/v1/monitor", tags=["monitor"])
app.include_router(recipes_router, prefix="/api/v1/recipes", tags=["recipes"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["profile"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["chat"])

# ── DB pool ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    await init_db(app.state.pool)

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute(CREATE_USERS_TABLE)
        await conn.execute(CREATE_RECIPES_TABLE)
        await conn.execute(CREATE_SAVED_RECIPES_TABLE)
        await conn.execute(CREATE_CHAT_HISTORY_TABLE)
        await conn.execute(CREATE_DOCUMENTS_TABLE)
        await conn.execute(CREATE_TASK_LOGS_TABLE)

        # Seed admin user if not exists
        exists = await conn.fetchval("SELECT id FROM users LIMIT 1")
        if not exists:
            await conn.execute(SEED_ADMIN_USER,
                "Arjun Mehta",
                "Home cook obsessed with South Indian flavours and French technique.",
                "Veg", 32,
                ["Peanuts", "Shellfish"],
                ["South Indian", "French", "Mediterranean", "Italian"],
                "Intermediate", 124, 47
            )

            # Seed sample recipes
            sample_recipes = [
                ("Creamy Chocolate Mousse", "French", 30, "None", "Veg", "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80", "Cocoa powder, dark chocolate, cream", "1. Melt chocolate\n2. Whip cream\n3. Combine\n4. Chill", "A rich and creamy chocolate dessert"),
                ("Herbed Corn Bowl", "American", 20, "Mild", "Veg", "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=400&q=80", "Corn, herbs, lime, oil", "1. Cook corn\n2. Add herbs\n3. Squeeze lime", "Fresh and vibrant corn salad"),
                ("Stuffed Grape Leaves", "Mediterranean", 45, "Medium", "Veg", "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80", "Grape leaves, rice, spices", "1. Prepare leaves\n2. Fill with rice\n3. Roll\n4. Steam", "Traditional Mediterranean rolls"),
            ]
            for title, cuisine, time_mins, spice, diet, img_url, ingredients, steps, desc in sample_recipes:
                await conn.execute("""
                    INSERT INTO recipes (title, cuisine, time_mins, spice_level, diet_type, image_url, ingredients, steps, description)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                """, title, cuisine, time_mins, spice, diet, img_url, ingredients, steps, desc)

# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok"}

# ── WebSocket Progress ──────────────────────────────────────────────────────
@app.websocket("/api/ws/progress/{recipe_id}")
async def websocket_progress(websocket: WebSocket, recipe_id: str):
    await websocket.accept()
    r = aioredis.from_url(REDIS_URL)
    pubsub = r.pubsub()
    channel_name = f"progress_{recipe_id}"
    await pubsub.subscribe(channel_name)
    
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                data = message["data"].decode("utf-8")
                await websocket.send_text(data)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        await pubsub.unsubscribe(channel_name)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await pubsub.close()

# Legacy or Shared endpoints can be placed here if not moved yet
# ... but everything was moved to modules.