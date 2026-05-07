from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas.chat_schema import ChatRequest, ChatResponse
from services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/recipe/stream")
async def chat_recipe_stream(body: ChatRequest):
    """Streaming chat endpoint for recipe questions."""
    return StreamingResponse(
        chat_service.get_streaming_response(
            message=body.message,
            recipe_id=body.recipe_id,
            recipe_title=body.recipe_title
        ),
        media_type="text/event-stream"
    )

@router.post("/recipe", response_model=ChatResponse)
async def chat_recipe(body: ChatRequest):
    """Static chat endpoint for recipe questions."""
    try:
        return await chat_service.get_response(
            message=body.message,
            recipe_id=body.recipe_id,
            recipe_title=body.recipe_title
        )
    except Exception as e:
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.post("/stream")
async def chat_stream(body: ChatRequest):
    """General streaming chat endpoint."""
    return StreamingResponse(
        chat_service.get_streaming_response(message=body.message),
        media_type="text/event-stream"
    )

@router.post("/", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """General static chat endpoint."""
    try:
        return await chat_service.get_response(message=body.message)
    except Exception as e:
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "ok"}
