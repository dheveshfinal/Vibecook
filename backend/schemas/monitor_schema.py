from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class LogEntry(BaseModel):
    id: UUID
    task_id: Optional[str] = None
    level: str
    module: str
    message: str
    timestamp: datetime
