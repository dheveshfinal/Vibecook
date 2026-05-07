from typing import List, Optional
from schemas.chat_schema import ChatResponse
from orchestration.rag_graph import rag_graph
import json

class ChatService:
    async def get_response(
        self, 
        message: str,
        recipe_id: Optional[str] = None,
        recipe_title: Optional[str] = None
    ) -> ChatResponse:
        """Get static AI response using LangGraph."""
        try:
            inputs = {
                "query": message,
                "recipe_id": recipe_id,
                "recipe_title": recipe_title,
                "stream": False
            }
            # Run the graph
            result = await rag_graph.ainvoke(inputs)
            
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
        message: str,
        recipe_id: Optional[str] = None,
        recipe_title: Optional[str] = None
    ):
        """Get streaming AI response using LangGraph context."""
        try:
            # 1. First run the retrieval part of the graph (we could split the graph but for now we'll do it sequentially for context chunks)
            inputs = {
                "query": message,
                "recipe_id": recipe_id,
                "recipe_title": recipe_title,
                "stream": True # This tells the generate node to return a generator
            }
            
            # For streaming, we manually call the nodes to yield metadata first
            from orchestration.rag_graph import retrieve_node, generate_node
            
            state = await retrieve_node(inputs)
            
            yield json.dumps({
                "type": "metadata",
                "context": state["context"],
                "sources": state["sources"]
            }) + "\n"
            
            # Now run generation
            res_state = await generate_node(state)
            generator = res_state["response"]
            
            async for chunk in generator:
                yield json.dumps({"type": "content", "delta": chunk}) + "\n"
                
        except Exception as e:
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"
