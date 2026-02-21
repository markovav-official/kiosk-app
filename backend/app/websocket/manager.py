"""WebSocket connection manager: clients and monitor connections."""
import json
import uuid
from typing import Callable, Awaitable

from fastapi import WebSocket

from app.state.registry import ClientRegistry
from app.state.groups import GroupsStore


class ConnectionManager:
    """Manages WebSocket connections for clients and monitors."""

    def __init__(self, registry: ClientRegistry, groups: GroupsStore):
        self.registry = registry
        self.groups = groups
        self._client_connections: dict[str, WebSocket] = {}  # ws_id -> WebSocket (kiosk clients)
        self._monitor_connections: list[WebSocket] = []  # monitor dashboards
        self._ws_id_to_connection: dict[str, WebSocket] = {}  # ws_id -> WebSocket (all)

    def _ws_id(self, ws: WebSocket) -> str:
        """Get or assign an id for this websocket."""
        for wid, w in self._ws_id_to_connection.items():
            if w == ws:
                return wid
        wid = str(uuid.uuid4())
        self._ws_id_to_connection[wid] = ws
        return wid

    # --- Client connections ---
    def add_client(self, ws: WebSocket) -> str:
        """Register client connection, return ws_id."""
        ws_id = self._ws_id(ws)
        self._client_connections[ws_id] = ws
        return ws_id

    def remove_client(self, ws: WebSocket) -> str | None:
        """Remove client connection. Returns ws_id."""
        ws_id = None
        for wid, w in list(self._client_connections.items()):
            if w == ws:
                ws_id = wid
                del self._client_connections[wid]
                break
        if ws_id:
            self._ws_id_to_connection.pop(ws_id, None)
        return ws_id

    def get_client_ws(self, client_id: str) -> WebSocket | None:
        """Get WebSocket for a client_id."""
        ws_id = self.registry.get_ws_id_by_client_id(client_id)
        if not ws_id:
            return None
        return self._client_connections.get(ws_id)

    async def send_to_client(self, client_id: str, message: dict) -> bool:
        """Send JSON message to one client. Returns True if sent."""
        ws = self.get_client_ws(client_id)
        if not ws:
            return False
        try:
            await ws.send_json(message)
            return True
        except Exception:
            return False

    async def send_to_clients(self, client_ids: list[str], message: dict) -> None:
        """Send message to multiple clients."""
        for cid in client_ids:
            await self.send_to_client(cid, message)

    # --- Monitor connections ---
    def add_monitor(self, ws: WebSocket) -> None:
        self._monitor_connections.append(ws)

    def remove_monitor(self, ws: WebSocket) -> None:
        if ws in self._monitor_connections:
            self._monitor_connections.remove(ws)

    async def broadcast_to_monitors(self, message: dict) -> None:
        """Send JSON to all connected monitors."""
        dead = []
        for ws in self._monitor_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.remove_monitor(ws)
