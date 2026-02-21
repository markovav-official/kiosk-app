"""Client registry: connected kiosk clients and their state."""
import uuid
from datetime import datetime
from dataclasses import dataclass, field

from app.models.schemas import ClientInfo


@dataclass
class ClientState:
    """State of one connected client."""
    client_id: str
    hostname: str
    group_id: str | None
    current_url: str | None
    connected_at: datetime
    last_seen: datetime
    last_screen_b64: str | None = None
    last_camera_b64: str | None = None
    last_audio_b64: str | None = None

    def to_info(self) -> ClientInfo:
        return ClientInfo(
            client_id=self.client_id,
            hostname=self.hostname,
            group_id=self.group_id,
            current_url=self.current_url,
            connected_at=self.connected_at.isoformat(),
            last_seen=self.last_seen.isoformat(),
        )


class ClientRegistry:
    """In-memory registry of connected clients."""

    def __init__(self):
        self._clients: dict[str, ClientState] = {}
        self._client_id_by_ws_id: dict[str, str] = {}  # websocket id -> client_id

    def register(self, ws_id: str, hostname: str = "", group_id: str | None = None) -> str:
        """Register a new client, return client_id."""
        client_id = str(uuid.uuid4())
        now = datetime.utcnow()
        self._clients[client_id] = ClientState(
            client_id=client_id,
            hostname=hostname or f"client-{client_id[:8]}",
            group_id=group_id,
            current_url=None,
            connected_at=now,
            last_seen=now,
        )
        self._client_id_by_ws_id[ws_id] = client_id
        return client_id

    def unregister_by_ws_id(self, ws_id: str) -> str | None:
        """Remove client by websocket id. Returns client_id if was registered."""
        client_id = self._client_id_by_ws_id.pop(ws_id, None)
        if client_id:
            self._clients.pop(client_id, None)
        return client_id

    def get_client_id(self, ws_id: str) -> str | None:
        return self._client_id_by_ws_id.get(ws_id)

    def get_ws_id_by_client_id(self, client_id: str) -> str | None:
        for wid, cid in self._client_id_by_ws_id.items():
            if cid == client_id:
                return wid
        return None

    def get(self, client_id: str) -> ClientState | None:
        return self._clients.get(client_id)

    def touch(self, client_id: str) -> None:
        """Update last_seen."""
        c = self._clients.get(client_id)
        if c:
            c.last_seen = datetime.utcnow()

    def set_current_url(self, client_id: str, url: str | None) -> None:
        c = self._clients.get(client_id)
        if c:
            c.current_url = url

    def set_group(self, client_id: str, group_id: str | None) -> None:
        c = self._clients.get(client_id)
        if c:
            c.group_id = group_id

    def set_media(self, client_id: str, kind: str, data_b64: str) -> None:
        c = self._clients.get(client_id)
        if not c:
            return
        if kind == "screen":
            c.last_screen_b64 = data_b64
        elif kind == "camera":
            c.last_camera_b64 = data_b64
        elif kind == "audio":
            c.last_audio_b64 = data_b64

    def list_all(self) -> list[ClientInfo]:
        return [c.to_info() for c in self._clients.values()]

    def list_by_group(self, group_id: str) -> list[str]:
        return [c.client_id for c in self._clients.values() if c.group_id == group_id]

    def get_media(self, client_id: str) -> dict[str, str | None]:
        c = self._clients.get(client_id)
        if not c:
            return {}
        return {
            "screen": c.last_screen_b64,
            "camera": c.last_camera_b64,
            "audio": c.last_audio_b64,
        }
