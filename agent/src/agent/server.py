from fastapi import FastAPI

from .agent import agent
from .chat_router import create_chat_router

app = FastAPI(title='AI Chat API')
app.include_router(
    create_chat_router(
        agent=agent,
    ),
    prefix='/api/chat',
)
