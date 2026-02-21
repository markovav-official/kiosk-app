"""REST API: list clients and groups (for monitor)."""
from fastapi import APIRouter, Depends

from app.auth import get_token_header
from app.services.connection_manager import get_manager

router = APIRouter(prefix="/api", tags=["clients"])


@router.get("/clients")
async def list_clients(_: str = Depends(get_token_header)):
    """List all connected clients."""
    manager = get_manager()
    clients = manager.registry.list_all()
    return {"clients": [c.model_dump() for c in clients]}


@router.get("/groups")
async def list_groups(_: str = Depends(get_token_header)):
    """List all groups with client ids."""
    manager = get_manager()
    groups = manager.groups.list_all()
    return {
        "groups": [
            {"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids}
            for g in groups
        ]
    }
