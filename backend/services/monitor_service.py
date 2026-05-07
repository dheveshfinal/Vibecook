import os
import asyncpg
from typing import List, Optional

from core.config import DATABASE_URL

class MonitorService:
    @staticmethod
    async def clear_logs(task_id: str):
        """Clears all logs associated with a specific task_id."""
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute("DELETE FROM task_logs WHERE task_id = $1", task_id)
        finally:
            await conn.close()

    @staticmethod
    async def log_event(module: str, message: str, task_id: Optional[str] = None, level: str = "INFO"):
        """Logs an event. Handles its own connection if called from non-FastAPI context (like Celery)."""
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            await conn.execute("""
                INSERT INTO task_logs (task_id, module, message, level)
                VALUES ($1, $2, $3, $4)
            """, task_id, module, message, level)
        finally:
            await conn.close()

    @staticmethod
    async def get_logs(pool: asyncpg.Pool, limit: int = 100, module: Optional[str] = None) -> List[dict]:
        async with pool.acquire() as conn:
            query = "SELECT * FROM task_logs"
            params = []
            if module:
                query += " WHERE module = $1"
                params.append(module)
            query += " ORDER BY timestamp DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            rows = await conn.fetch(query, *params)
            return [dict(r) for r in rows]
