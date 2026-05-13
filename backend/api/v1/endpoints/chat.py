from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import ChatService
from api.deps import get_current_user
from typing import List

router = APIRouter()
chat_service = ChatService()

@router.post("/recipe/stream")
async def chat_recipe_stream(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    """Streaming chat endpoint for recipe questions."""
    pool = request.app.state.pool
    return StreamingResponse(
        chat_service.get_streaming_response(
            pool=pool,
            user_id=user_id,
            message=body.message,
            recipe_id=body.recipe_id,
            recipe_title=body.recipe_title
        ),
        media_type="text/event-stream"
    )

@router.post("/recipe", response_model=ChatResponse)
async def chat_recipe(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    """Static chat endpoint for recipe questions."""
    pool = request.app.state.pool
    try:
        return await chat_service.get_response(
            pool=pool,
            user_id=user_id,
            message=body.message,
            recipe_id=body.recipe_id,
            recipe_title=body.recipe_title
        )
    except Exception as e:
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.post("/stream")
async def chat_stream(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    """General streaming chat endpoint."""
    pool = request.app.state.pool
    return StreamingResponse(
        chat_service.get_streaming_response(
            pool=pool, 
            user_id=user_id, 
            message=body.message
        ),
        media_type="text/event-stream"
    )

@router.post("/", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest, user_id: str = Depends(get_current_user)):
    """General static chat endpoint."""
    pool = request.app.state.pool
    try:
        return await chat_service.get_response(
            pool=pool, 
            user_id=user_id, 
            message=body.message
        )
    except Exception as e:
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.get("/history", response_model=List[dict])
async def get_chat_history(request: Request, user_id: str = Depends(get_current_user)):
    """Retrieve chat history for the current user."""
    pool = request.app.state.pool
    return await chat_service.get_history(pool, user_id)

@router.get("/health")
async def health_check():
    return {"status": "ok"}
