"""REST API: create/update groups."""
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_token_header
from app.services.connection_manager import get_manager
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["groups"])


class GroupCreate(BaseModel):
    group_id: str
    name: str | None = None


@router.post("/groups")
async def create_or_update_group(body: GroupCreate, _: str = Depends(get_token_header)):
    """Create group or update its name."""
    manager = get_manager()
    manager.groups.ensure_group(body.group_id, body.name)
    g = manager.groups.get(body.group_id)
    return {"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids}
