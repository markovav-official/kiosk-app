"""Request body schemas for client API."""
from pydantic import BaseModel


class ClientUpdateBody(BaseModel):
    group_id: str | None = None
    display_name: str | None = None
