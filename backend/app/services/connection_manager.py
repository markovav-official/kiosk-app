"""Singleton connection manager for dependency injection."""
from app.state.registry import ClientRegistry
from app.state.groups import GroupsStore
from app.websocket.manager import ConnectionManager

_registry = ClientRegistry()
_groups = GroupsStore()
_manager: ConnectionManager | None = None


def get_manager() -> ConnectionManager:
    global _manager
    if _manager is None:
        _manager = ConnectionManager(_registry, _groups)
    return _manager


def get_registry() -> ClientRegistry:
    return _registry


def get_groups() -> GroupsStore:
    return _groups
