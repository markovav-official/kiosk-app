"""REST API for monitor: send commands to clients (open_url, close_site, close_app, shutdown)."""
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_token_header
from app.services.connection_manager import get_manager
from app.routers.schema_commands import OpenUrlBody

router = APIRouter(prefix="/kiosk-api", tags=["commands"])


@router.post("/clients/{client_id}/open_url")
async def open_url(
    client_id: str,
    body: OpenUrlBody,
    _: str = Depends(get_token_header),
):
    """Open URL on a single client."""
    manager = get_manager()
    ok = await manager.send_to_client(client_id, {"type": "open_url", "url": body.url})
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found or disconnected")
    return {"ok": True}


@router.post("/clients/{client_id}/close_site")
async def close_site(client_id: str, _: str = Depends(get_token_header)):
    manager = get_manager()
    ok = await manager.send_to_client(client_id, {"type": "close_site"})
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}


@router.post("/clients/{client_id}/close_app")
async def close_app(client_id: str, _: str = Depends(get_token_header)):
    manager = get_manager()
    ok = await manager.send_to_client(client_id, {"type": "close_app"})
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}


@router.post("/clients/{client_id}/shutdown")
async def shutdown_client(client_id: str, _: str = Depends(get_token_header)):
    manager = get_manager()
    ok = await manager.send_to_client(client_id, {"type": "shutdown"})
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}


@router.post("/groups/{group_id}/open_url")
async def group_open_url(
    group_id: str,
    body: OpenUrlBody,
    _: str = Depends(get_token_header),
):
    """Open URL on all clients in group."""
    manager = get_manager()
    g = manager.groups.get(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await manager.send_to_clients(g.client_ids, {"type": "open_url", "url": body.url})
    return {"ok": True, "count": len(g.client_ids)}


@router.post("/groups/{group_id}/close_site")
async def group_close_site(group_id: str, _: str = Depends(get_token_header)):
    g = get_manager().groups.get(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await get_manager().send_to_clients(g.client_ids, {"type": "close_site"})
    return {"ok": True, "count": len(g.client_ids)}


@router.post("/groups/{group_id}/close_app")
async def group_close_app(group_id: str, _: str = Depends(get_token_header)):
    g = get_manager().groups.get(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await get_manager().send_to_clients(g.client_ids, {"type": "close_app"})
    return {"ok": True, "count": len(g.client_ids)}


@router.post("/groups/{group_id}/shutdown")
async def group_shutdown(group_id: str, _: str = Depends(get_token_header)):
    g = get_manager().groups.get(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    await get_manager().send_to_clients(g.client_ids, {"type": "shutdown"})
    return {"ok": True, "count": len(g.client_ids)}
