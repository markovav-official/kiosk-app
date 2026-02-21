"""Pydantic schemas for messages and API."""
from typing import Literal
from pydantic import BaseModel, Field


# --- Client -> Backend ---
class ClientRegister(BaseModel):
    """Initial client registration (type=register)."""
    type: Literal["register"] = "register"
    hostname: str = ""
    group_id: str | None = None  # optional group to join
    device_id: str | None = None  # persistent device UUID for reattach on reconnect


class ClientMediaFrame(BaseModel):
    """Screen/camera frame or audio chunk (type=media)."""
    type: Literal["media"] = "media"
    kind: Literal["screen", "camera", "audio"] = "screen"
    data: str = ""  # base64
    mime: str = "image/jpeg"


class ClientPong(BaseModel):
    """Pong for ping (type=pong)."""
    type: Literal["pong"] = "pong"


# --- Backend -> Client ---
class ServerOpenUrl(BaseModel):
    """Command: open URL in browser (type=open_url)."""
    type: Literal["open_url"] = "open_url"
    url: str


class ServerCloseSite(BaseModel):
    """Command: close site, back to waiting (type=close_site)."""
    type: Literal["close_site"] = "close_site"


class ServerCloseApp(BaseModel):
    """Command: quit the client app (type=close_app)."""
    type: Literal["close_app"] = "close_app"


class ServerShutdown(BaseModel):
    """Command: shutdown the machine (type=shutdown)."""
    type: Literal["shutdown"] = "shutdown"


class ServerPing(BaseModel):
    """Ping for keepalive (type=ping)."""
    type: Literal["ping"] = "ping"


# --- Backend -> Monitor ---
class ClientInfo(BaseModel):
    """Client device info for monitor."""
    client_id: str
    device_id: str | None
    hostname: str
    display_name: str | None  # override name from monitor
    group_id: str | None
    current_url: str | None
    connected_at: str
    last_seen: str
    connected: bool


class GroupInfo(BaseModel):
    """Group with client ids."""
    group_id: str
    name: str
    client_ids: list[str] = Field(default_factory=list)


class MonitorMessage(BaseModel):
    """Message to monitor (type + payload)."""
    type: str  # clients_list | groups_list | media | client_joined | client_left | etc.
    payload: dict = Field(default_factory=dict)
