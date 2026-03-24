from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic_ai import Agent
from pydantic_ai.ui.vercel_ai import VercelAIAdapter


def create_chat_router(
    *,
    agent: Agent[Any, Any],
) -> APIRouter:
    router = APIRouter()

    @router.post('/chat/{conversation_id}')
    async def post_chat(
        request: Request,
        conversation_id: str,
    ) -> StreamingResponse:
        adapter = await VercelAIAdapter.from_request(
            request,
            agent=agent,
            sdk_version=6,
        )
        return adapter.streaming_response(adapter.run_stream())

    return router
