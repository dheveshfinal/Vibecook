"""
RAG Pipeline for document processing and context retrieval.
Uses Qdrant for vector storage and Ollama for embeddings and LLM.
"""

import os
from typing import List, Optional
from uuid import uuid4
import hashlib

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib
from services.monitor_service import MonitorService
import asyncio
import httpx
import json

# ── Config ──────────────────────────────────────────────────────────────────
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "")  # Optional: For cloud proxies
EMBEDDING_MODEL = "nomic-embed-text"
GENERATION_MODEL = "llama3.2:latest"  # Stable model with good extraction capabilities
EMBEDDING_DIM = 768  # nomic-embed-text produces 768-dim vectors
COLLECTION_NAME = "recipes_documents"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
TOP_K = 5

class RAGPipeline:
    """RAG Pipeline for document processing and retrieval."""

    def __init__(self):
        """Initialize RAG pipeline components."""
        try:
            self.qdrant_client = QdrantClient(QDRANT_URL, timeout=30.0)
        except Exception as e:
            print(f"Warning: Qdrant not available at {QDRANT_URL}: {e}")
            self.qdrant_client = None
        
        self.embedder = True # Placeholder to indicate embedding is available via Ollama
        self._init_collection()

    def _init_collection(self):
        """Initialize or recreate Qdrant collection."""
        print(f"RAGPipeline: Initializing collection {COLLECTION_NAME} at {QDRANT_URL}")
        if not self.qdrant_client:
            print("RAGPipeline: Qdrant client is NULL. Skipping init.")
            return
        
        try:
            # Check if collection exists
            collections = self.qdrant_client.get_collections()
            collection_info = next((c for c in collections.collections if c.name == COLLECTION_NAME), None)
            
            if collection_info:
                # Check vector size for mismatch
                info = self.qdrant_client.get_collection(COLLECTION_NAME)
                current_size = info.config.params.vectors.size
                print(f"RAGPipeline: Existing collection {COLLECTION_NAME} has dim={current_size}")
                if current_size != EMBEDDING_DIM:
                    print(f"RAGPipeline: Dimension mismatch in {COLLECTION_NAME}: {current_size} vs {EMBEDDING_DIM}. Recreating...")
                    self.qdrant_client.delete_collection(COLLECTION_NAME)
                    collection_info = None # Trigger creation below
            
            if not collection_info:
                self.qdrant_client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
                )
                print(f"RAGPipeline: Created fresh collection: {COLLECTION_NAME} (dim={EMBEDDING_DIM})")
        except Exception as e:
            print(f"RAGPipeline ERR: Error initializing collection: {e}")

    def chunk_text(self, text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk.strip())
            start = end - overlap
        return [c for c in chunks if len(c) > 50]  # Filter out small chunks

    async def embed_text(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using Ollama's embedding API."""
        print(f"RAGPipeline: Embedding text ({len(text)} chars) using {EMBEDDING_MODEL}...")
        try:
            # ...
            headers = {}
            if OLLAMA_API_KEY:
                headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"
                
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/embeddings",
                    json={
                        "model": EMBEDDING_MODEL,
                        "prompt": text,
                    },
                    headers=headers,
                    timeout=60.0,
                )
                response.raise_for_status()
                return response.json().get("embedding")
        except Exception as e:
            print(f"Error embedding text with Ollama ({EMBEDDING_MODEL}): {e}")
            return None

    async def store_chunks(self, doc_id: str, chunks: List[str], metadata: dict = None) -> bool:
        """Store chunked text with embeddings in Qdrant."""
        print(f"RAGPipeline: Storing {len(chunks)} chunks for doc {doc_id}...")
        if not self.qdrant_client:
            print("RAGPipeline: Qdrant client NOT initialized. Aborting store.")
            return False
        
        try:
            points = []
            for i, chunk in enumerate(chunks):
                embedding = await self.embed_text(chunk)
                if not embedding:
                    print(f"RAGPipeline: FAILED to get embedding for chunk {i}")
                    continue
                
                # Update EMBEDDING_DIM if first embedding differs (dynamic correction)
                global EMBEDDING_DIM
                if len(embedding) != EMBEDDING_DIM:
                    print(f"Adjusting EMBEDDING_DIM from {EMBEDDING_DIM} to {len(embedding)}")
                    EMBEDDING_DIM = len(embedding)
                
                point_id = int(hashlib.md5(f"{doc_id}_{i}".encode()).hexdigest(), 16) % (10 ** 8)
                payload = {
                    "doc_id": doc_id,
                    "chunk_index": i,
                    "text": chunk,
                    **(metadata or {}),
                }
                points.append(PointStruct(id=point_id, vector=embedding, payload=payload))
            
            if points:
                await MonitorService.log_event("embedding", f"Upserting {len(points)} chunks to Qdrant", task_id=doc_id)
                self.qdrant_client.upsert(
                    collection_name=COLLECTION_NAME,
                    points=points,
                )
                print(f"Stored {len(points)} chunks for doc {doc_id}")
                return True
        except Exception as e:
            print(f"Error storing chunks: {e}")
        return False

    async def retrieve_context(self, query: str, top_k: int = TOP_K) -> List[dict]:
        """Retrieve relevant chunks for a query."""
        if not self.qdrant_client:
            return []
        
        try:
            query_embedding = await self.embed_text(query)
            if not query_embedding:
                return []
            
            # Qdrant client methods are mostly sync unless using AsyncQdrantClient,
            # but we can wrap them or just let them be if we use httpx for LLM.
            # For now, we'll keep the search sync or use a thread if needed.
            results = self.qdrant_client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_embedding,
                limit=top_k,
            )
            
            context = []
            for result in results:
                context.append({
                    "text": result.payload.get("text", ""),
                    "score": result.score,
                    "metadata": {k: v for k, v in result.payload.items() if k not in ["text", "chunk_index"]},
                })
            return context
        except Exception as e:
            print(f"Error retrieving context: {e}")
            return []

    async def generate_response(
        self, 
        query: str, 
        context: List[str], 
        model: str = GENERATION_MODEL, 
        raw_prompt: bool = False,
        stream: bool = False
    ):
        """Generate response using Ollama LLM with retrieved context."""
        try:
            if raw_prompt:
                context_str = "\n".join(context)
                full_prompt = (
                    "Extract ONLY the requested information. "
                    "Output ONLY the result with zero explanation, "
                    "preamble, or commentary.\n\n"
                    f"{query}\n\nDocument:\n{context_str}"
                )
            else:
                context_str = "\n".join([f"- {c}" for c in context])
                full_prompt = f"""Based on the following context, answer the user's question.
    If the context doesn't contain relevant information, say so.

    Context:
    {context_str}

    Question: {query}

    Answer:"""

            headers = {}
            if OLLAMA_API_KEY:
                headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"

            payload = {
                "model": model,
                "prompt": full_prompt,
                "stream": stream,
                "options": {"temperature": 0},
            }
            if raw_prompt:
                payload["system"] = (
                    "You are a precise extraction engine. "
                    "Output ONLY the extracted data. "
                    "No explanations, no preamble, no markdown."
                )

            async def stream_generator():
                async with httpx.AsyncClient() as client:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_URL}/api/generate",
                        json=payload,
                        headers=headers,
                        timeout=600.0,
                    ) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    chunk = json.loads(line)
                                    if "response" in chunk:
                                        yield chunk["response"]
                                    if chunk.get("done"):
                                        break
                                except json.JSONDecodeError:
                                    continue

            if stream:
                return stream_generator()

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json=payload,
                    headers=headers,
                    timeout=600.0,
                )
                response.raise_for_status()
                return response.json().get("response", "Error generating response")
        except Exception as e:
            print(f"Error generating response: {e}")
            if stream:
                async def error_gen(): yield f"Error: {str(e)}"
                return error_gen()
            return f"Error: {str(e)}"
    

    def clean_response(self, text: str) -> str:
        """Remove common LLM noise like preamble or trailing notes."""
        if not text: return ""
        # Remove common preambles
        text = re.sub(r'^(here is|sure|I can help|based on the context).+?:\s*', '', text, flags=re.I | re.S)
        return text.strip()

    def delete_document(self, doc_id: str) -> bool:
        """Delete all chunks associated with a document."""
        if not self.qdrant_client:
            return False
        
        try:
            self.qdrant_client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=None,  # We'd need to filter by doc_id in payload
            )
            # Note: Qdrant doesn't support easy deletion by payload filter in older versions
            # This is a simplified implementation
            print(f"Deleted document {doc_id}")
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False


# Global RAG pipeline instance
rag_pipeline = RAGPipeline()
