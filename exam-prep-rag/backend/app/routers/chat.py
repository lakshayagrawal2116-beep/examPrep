"""Chat router — SSE streaming RAG responses."""

import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import ChatRequest
from app.services import rag_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/query")
async def query(request: ChatRequest):
    """
    Send a question and receive a streaming response via Server-Sent Events.

    The stream emits events in this order:
    1. Multiple 'token' events with answer chunks
    2. One 'sources' event with citation data
    3. One 'done' event to signal completion
    """

    async def event_generator():
        async for event in rag_service.query_stream(
            question=request.question,
            doc_ids=request.doc_ids if request.doc_ids else None,
            chat_history=request.chat_history,
        ):
            event_type = event.get("type", "token")

            if event_type == "token":
                yield {
                    "event": "token",
                    "data": json.dumps({"content": event["content"]})
                }
            elif event_type == "sources":
                yield {
                    "event": "sources",
                    "data": json.dumps({"sources": event["sources"]})
                }
            elif event_type == "error":
                yield {
                    "event": "error",
                    "data": json.dumps({"content": event["content"]})
                }
            elif event_type == "done":
                yield {
                    "event": "done",
                    "data": json.dumps({"status": "complete"})
                }

    return EventSourceResponse(event_generator())
