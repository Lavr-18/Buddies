from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from app.config import settings
from app.routers import auth, requests, responses

VITE_URL = "http://frontend:5173"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.bot_token and settings.webapp_url:
        from app.bot import bot
        webhook_url = f"{settings.webapp_url}/webhook"
        await bot.set_webhook(webhook_url)
    yield
    if settings.bot_token:
        from app.bot import bot
        await bot.delete_webhook()
        await bot.session.close()


app = FastAPI(title="Buddies API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(requests.router)
app.include_router(responses.router)


@app.post("/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    from app.bot import process_update
    await process_update(data)
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.api_route("/{path:path}", methods=["GET", "HEAD"])
async def proxy_to_vite(path: str, request: Request):
    url = f"{VITE_URL}/{path}"
    if request.url.query:
        url += f"?{request.url.query}"

    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in ("host", "content-length")
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                timeout=10,
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type"),
            )
        except httpx.ConnectError:
            return Response(content="Frontend not ready", status_code=503)
