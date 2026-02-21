"""FastAPI application: WebSocket endpoints and REST API."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import validate_token
from app.services.connection_manager import get_manager
from app.websocket.handlers import handle_client_message
from app.routers import commands, clients, groups

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_manager()
    yield
    # cleanup if needed


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(clients.router)
app.include_router(commands.router)
app.include_router(groups.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.websocket(settings.ws_client_path)
async def websocket_client(
    websocket: WebSocket,
    token: str | None = Query(None, alias="token"),
):
    """WebSocket for kiosk clients. Query: ?token=xxx"""
    if not validate_token(token):
        await websocket.close(code=4001, reason="Invalid or missing token")
        return
    await websocket.accept()
    manager = get_manager()
    ws_id = manager.add_client(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            await handle_client_message(manager, ws_id, raw)
    except WebSocketDisconnect:
        pass
    finally:
        manager.remove_client(websocket)
        client_id = manager.registry.unregister_by_ws_id(ws_id)
        if client_id:
            manager.groups.remove_client(client_id)
            await manager.broadcast_to_monitors({
                "type": "client_left",
                "payload": {"client_id": client_id},
            })
            await manager.broadcast_to_monitors({
                "type": "clients_list",
                "payload": {"clients": [c.model_dump() for c in manager.registry.list_all()]},
            })
            await manager.broadcast_to_monitors({
                "type": "groups_list",
                "payload": {"groups": [{"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids} for g in manager.groups.list_all()]},
            })


@app.websocket(settings.ws_monitor_path)
async def websocket_monitor(
    websocket: WebSocket,
    token: str | None = Query(None, alias="token"),
):
    """WebSocket for monitor dashboard. Query: ?token=xxx"""
    if not validate_token(token):
        await websocket.close(code=4001, reason="Invalid or missing token")
        return
    await websocket.accept()
    manager = get_manager()
    manager.add_monitor(websocket)
    try:
        await websocket.send_json({
            "type": "clients_list",
            "payload": {"clients": [c.model_dump() for c in manager.registry.list_all()]},
        })
        await websocket.send_json({
            "type": "groups_list",
            "payload": {"groups": [{"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids} for g in manager.groups.list_all()]},
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.remove_monitor(websocket)
