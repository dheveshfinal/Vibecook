import json
import asyncpg
from typing import List, Optional
from schemas.chat_schema import ChatResponse
from orchestration.rag_graph import rag_graph

class ChatService:
    async def get_response(
        self, 
        pool: asyncpg.Pool,
        user_id: str,
        message: str,
        recipe_id: Optional[str] = None,
        recipe_title: Optional[str] = None
    ) -> ChatResponse:
        """Get static AI response and save to history."""
        try:
            inputs = {
                "query": message,
                "recipe_id": recipe_id,
                "recipe_title": recipe_title,
                "stream": False
            }
            # Run the graph
            result = await rag_graph.ainvoke(inputs)
            
            # Save to history
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO chat_history (user_id, message, response, context)
                    VALUES ($1::uuid, $2, $3, $4)
                    """,
                    user_id, message, result["response"], json.dumps(result["context"])
                )
            
            return ChatResponse(
                response=result["response"],
                context=result["context"],
                sources=result["sources"]
            )
        except Exception as e:
            print(f"Error in chat service: {e}")
            return ChatResponse(response=f"Error: {str(e)}", context=[], sources=None)

    async def get_streaming_response(
        self, 
        pool: asyncpg.Pool,
        user_id: str,
        message: str,
        recipe_id: Optional[str] = None,
        recipe_title: Optional[str] = None
    ):
        """Get streaming AI response and save to history."""
        try:
            inputs = {
                "query": message,
                "recipe_id": recipe_id,
                "recipe_title": recipe_title,
                "stream": True
            }
            
            from orchestration.rag_graph import retrieve_node, generate_node
            state = await retrieve_node(inputs)
            
            yield json.dumps({
                "type": "metadata",
                "context": state["context"],
                "sources": state["sources"]
            }) + "\n"
            
            res_state = await generate_node(state)
            generator = res_state["response"]
            
            full_response = ""
            async for chunk in generator:
                full_response += chunk
                yield json.dumps({"type": "content", "delta": chunk}) + "\n"
                
            # Save to history after stream completes
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO chat_history (user_id, message, response, context)
                    VALUES ($1::uuid, $2, $3, $4)
                    """,
                    user_id, message, full_response, json.dumps(state["context"])
                )
                
        except Exception as e:
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

    async def get_history(self, pool: asyncpg.Pool, user_id: str) -> List[dict]:
        """Fetch chat history for a specific user."""
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM chat_history WHERE user_id=$1::uuid ORDER BY created_at ASC",
                user_id
            )
            return [dict(r) for r in rows]
