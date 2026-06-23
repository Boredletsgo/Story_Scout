"""Retrieval-Augmented Generation: embeddings, vector store, retriever, ingest."""

from app.rag.embeddings import get_embedding_function
from app.rag.retriever import BookRetriever, get_retriever
from app.rag.vector_store import get_chroma_collection

__all__ = [
    "get_embedding_function",
    "get_chroma_collection",
    "BookRetriever",
    "get_retriever",
]
