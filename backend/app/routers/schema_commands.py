"""Request body schemas for command API."""
from pydantic import BaseModel


class OpenUrlBody(BaseModel):
    url: str
