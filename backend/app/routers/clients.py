"""REST API: list clients and groups (for monitor)."""
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_token_header
from app.services.connection_manager import get_manager
from app.routers.schema_clients import ClientUpdateBody

router = APIRouter(prefix="/api", tags=["clients"])


@router.get("/clients")
async def list_clients(_: str = Depends(get_token_header)):
    """List all clients (connected and disconnected)."""
    manager = get_manager()
    clients = manager.registry.list_all()
    return {"clients": [c.model_dump() for c in clients]}


@router.patch("/clients/{client_id}")
async def update_client(
    client_id: str,
    body: ClientUpdateBody,
    _: str = Depends(get_token_header),
):
    """Update client group and/or display name. Sends set_group to client if connected."""
    manager = get_manager()
    if not manager.registry.get(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    if body.group_id is not None:
        manager.registry.set_group(client_id, body.group_id)
        manager.groups.remove_client(client_id)
        if body.group_id:
            manager.groups.add_client(body.group_id, client_id)
        await manager.send_to_client(
            client_id, {"type": "set_group", "group_id": body.group_id}
        )
    if body.display_name is not None:
        manager.registry.set_display_name(client_id, body.display_name)
    await manager.broadcast_to_monitors({
        "type": "clients_list",
        "payload": {"clients": [c.to_info().model_dump() for c in manager.registry._clients.values()]},
    })
    await manager.broadcast_to_monitors({
        "type": "groups_list",
        "payload": {"groups": [{"group_id": g.group_id, "name": g.name, "client_ids": g.client_ids} for g in manager.groups.list_all()]},
    })
    return {"ok": True}


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
