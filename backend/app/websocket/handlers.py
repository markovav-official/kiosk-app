"""WebSocket message handling: client and monitor logic."""
import json
import logging
from fastapi import WebSocket

from app.config import settings
from app.state.registry import ClientRegistry
from app.state.groups import GroupsStore
from app.websocket.manager import ConnectionManager
from app.models.schemas import ClientRegister, ClientMediaFrame

logger = logging.getLogger(__name__)


async def handle_client_message(
    manager: ConnectionManager,
    ws_id: str,
    raw: str,
) -> None:
    """Handle incoming message from a kiosk client."""
    registry = manager.registry
    groups = manager.groups
    client_id = registry.get_client_id(ws_id)
    if not client_id:
        try:
            data = json.loads(raw)
            if data.get("type") == "register":
                reg = ClientRegister(**{k: v for k, v in data.items() if k in ClientRegister.model_fields})
                client_id = registry.register(ws_id, reg.hostname, reg.group_id)
                if reg.group_id:
                    groups.add_client(reg.group_id, client_id)
                registry.touch(client_id)
                await manager.broadcast_to_monitors({
                    "type": "clients_list",
                    "payload": {"clients": [c.to_info().model_dump() for c in registry._clients.values()]},
                })
                await manager.broadcast_to_monitors({
                    "type": "groups_list",
                    "payload": {"groups": [{"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids} for g in groups.list_all()]},
                })
                await manager.broadcast_to_monitors({"type": "client_joined", "payload": {"client_id": client_id}})
            return
        except Exception as e:
            logger.warning("Client register parse error: %s", e)
            return

    try:
        data = json.loads(raw)
        msg_type = data.get("type")
        if msg_type == "ping":
            # Client keepalive; backend can respond with pong (handled in client)
            registry.touch(client_id)
            return
        if msg_type == "pong":
            registry.touch(client_id)
            return
        if msg_type == "media":
            frame = ClientMediaFrame(**{k: v for k, v in data.items() if k in ClientMediaFrame.model_fields})
            registry.set_media(client_id, frame.kind, frame.data)
            registry.touch(client_id)
            await manager.broadcast_to_monitors({
                "type": "media",
                "payload": {"client_id": client_id, "kind": frame.kind, "data": frame.data, "mime": frame.mime},
            })
            return
        if msg_type == "current_url":
            url = data.get("url")
            registry.set_current_url(client_id, url)
            registry.touch(client_id)
            await manager.broadcast_to_monitors({
                "type": "client_updated",
                "payload": {"client_id": client_id, "current_url": url},
            })
            return
    except Exception as e:
        logger.warning("Client message error: %s", e)
