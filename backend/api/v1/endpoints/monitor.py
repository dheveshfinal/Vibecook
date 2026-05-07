from fastapi import APIRouter, Request, Query
from typing import List, Optional
from schemas.monitor_schema import LogEntry
from services.monitor_service import MonitorService

router = APIRouter()

@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=1000),
    module: Optional[str] = None
):
    pool = request.app.state.pool
    return await MonitorService.get_logs(pool, limit, module)
