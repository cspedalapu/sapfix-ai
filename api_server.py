from __future__ import annotations

from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.chat_service import DEFAULT_MODEL, MODEL_LABELS, generate_chat_response

ModelId = Literal["llama3.1:8b", "gpt-4o-mini"]


class HistoryMessage(BaseModel):
    role: Literal["assistant", "user"]
    text: str


class ChatRequest(BaseModel):
    query: str = Field(min_length=1)
    model: ModelId = DEFAULT_MODEL
    top_k: int = Field(default=3, ge=1, le=5)
    history: list[HistoryMessage] = Field(default_factory=list)


app = FastAPI(title="SAPFix AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/models")
def models() -> list[dict[str, str]]:
    return [
        {"id": model_id, "label": label}
        for model_id, label in MODEL_LABELS.items()
    ]


@app.post("/chat")
def chat(request: ChatRequest) -> dict:
    history = [{"role": item.role, "text": item.text} for item in request.history]
    return generate_chat_response(
        query=request.query,
        model=request.model,
        top_k=request.top_k,
        history=history,
    )
