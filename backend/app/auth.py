"""Token-based authentication for WebSocket and API."""
from fastapi import WebSocket, Query, HTTPException, Depends
from fastapi.security import APIKeyHeader

from app.config import settings

API_KEY_HEADER = APIKeyHeader(name="X-Token", auto_error=False)


def validate_token(token: str | None) -> bool:
    """Validate auth token. Empty configured token means auth disabled."""
    if not settings.auth_token:
        return True
    return token == settings.auth_token


async def get_token_ws(websocket: WebSocket, token: str | None = Query(None, alias="token")) -> str | None:
    """Extract and validate token from WebSocket query (e.g. ?token=xxx)."""
    if not validate_token(token):
        await websocket.close(code=4001, reason="Invalid or missing token")
        return None
    return token


def get_token_header(api_key: str = Depends(API_KEY_HEADER)) -> str:
    """Validate token from X-Token header for REST API."""
    if not validate_token(api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return api_key or ""
