from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from rag_pipeline import rag_pipeline

class RAGState(TypedDict):
    """State for the RAG graph."""
    query: str
    recipe_id: Optional[str]
    recipe_title: Optional[str]
    context: List[dict]
    response: str
    sources: List[str]
    stream: bool

async def retrieve_node(state: RAGState) -> RAGState:
    """Node: Retrieve relevant context from Qdrant."""
    query = state["query"]
    recipe_title = state.get("recipe_title")
    
    contextual_query = f"About {recipe_title}: {query}" if recipe_title else query
    
    # Use existing RAG pipeline for retrieval
    context_chunks = await rag_pipeline.retrieve_context(contextual_query, top_k=3)
    
    sources = list(set([
        chunk.get("metadata", {}).get("recipe_title", "Unknown")
        for chunk in context_chunks
        if chunk.get("metadata")
    ]))
    
    return {
        **state,
        "context": context_chunks,
        "sources": sources
    }

async def generate_node(state: RAGState) -> RAGState:
    """Node: Generate response using LLM."""
    context_text = [chunk.get("text", "") for chunk in state["context"]]
    
    # Generate response (handling both stream and static)
    response = await rag_pipeline.generate_response(
        query=state["query"],
        context=context_text,
        stream=state["stream"]
    )
    
    return {
        **state,
        "response": response
    }

# Build the Graph
builder = StateGraph(RAGState)
builder.add_node("retrieve", retrieve_node)
builder.add_node("generate", generate_node)

builder.set_entry_point("retrieve")
builder.add_edge("retrieve", "generate")
builder.add_edge("generate", END)

rag_graph = builder.compile()
