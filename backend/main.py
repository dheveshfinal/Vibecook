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
from api.v1.endpoints.auth import router as auth_router

# Database Models
from models import (
    CREATE_USERS_TABLE,
    CREATE_RECIPES_TABLE,
    CREATE_SAVED_RECIPES_TABLE,
    CREATE_CHAT_HISTORY_TABLE,
    CREATE_DOCUMENTS_TABLE,
    CREATE_TASK_LOGS_TABLE,
    CREATE_FOLLOWS_TABLE,
    CREATE_CUSTOMIZED_RECIPES_TABLE,
)

from services.auth_service import AuthService
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
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

# ── DB pool ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        app.state.pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
        async with app.state.pool.acquire() as conn:
            await init_db(app.state.pool)
            # Create default admin if not exists
            await AuthService.create_default_admin(app.state.pool)
            
            # Heartbeat log to verify monitor is working
            from services.monitor_service import MonitorService
            await MonitorService.log_event(
                module="system", 
                message="Backend services initialized and database connected.", 
                level="INFO"
            )
            print("--- Database Connected and Startup Logged ---")
    except Exception as e:
        print(f"FAILED TO STARTUP DATABASE POOL: {e}")
        raise e

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute(CREATE_USERS_TABLE)
        await conn.execute(CREATE_RECIPES_TABLE)
        await conn.execute(CREATE_SAVED_RECIPES_TABLE)
        await conn.execute(CREATE_CUSTOMIZED_RECIPES_TABLE)
        await conn.execute(CREATE_CHAT_HISTORY_TABLE)
        await conn.execute(CREATE_DOCUMENTS_TABLE)
        await conn.execute(CREATE_TASK_LOGS_TABLE)
        await conn.execute(CREATE_FOLLOWS_TABLE)

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