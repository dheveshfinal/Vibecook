from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    recipe_id: Optional[str] = None
    recipe_title: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    context: Optional[List[dict]] = None
    sources: Optional[List[str]] = None

class MessageSchema(BaseModel):
    id: str
    text: str
    sender: str
    timestamp: datetime
