"""Application configuration from environment."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from .env."""

    app_name: str = "Kiosk Backend"
    # Auth: token that clients and monitor must send (e.g. in query or header)
    auth_token: str = ""
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    # WebSocket URL path for clients (kiosk devices)
    ws_client_path: str = "/kiosk-api/ws/client"
    # WebSocket URL path for monitor dashboard
    ws_monitor_path: str = "/kiosk-api/ws/monitor"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
