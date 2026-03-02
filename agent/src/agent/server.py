import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .agent import agent
from .chat_router import create_chat_router

app = FastAPI(title='AI Chat API')

default_origins = 'http://localhost:3000,http://127.0.0.1:3000'
allowed_origins = [
    origin.strip()
    for origin in os.getenv('ALLOWED_ORIGINS', default_origins).split(',')
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(
    create_chat_router(
        agent=agent,
    ),
    prefix='/api/chat',
)
