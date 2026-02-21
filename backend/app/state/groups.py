"""Groups: named groups for organizing clients."""
from dataclasses import dataclass, field


@dataclass
class Group:
    """A group of clients."""
    group_id: str
    name: str
    client_ids: list[str] = field(default_factory=list)


class GroupsStore:
    """In-memory store of groups."""

    def __init__(self):
        self._groups: dict[str, Group] = {}

    def ensure_group(self, group_id: str, name: str | None = None) -> Group:
        if group_id not in self._groups:
            self._groups[group_id] = Group(group_id=group_id, name=name or group_id)
        return self._groups[group_id]

    def get(self, group_id: str) -> Group | None:
        return self._groups.get(group_id)

    def list_all(self) -> list[Group]:
        return list(self._groups.values())

    def add_client(self, group_id: str, client_id: str) -> None:
        g = self.ensure_group(group_id)
        if client_id not in g.client_ids:
            g.client_ids.append(client_id)

    def remove_client(self, client_id: str) -> None:
        for g in self._groups.values():
            if client_id in g.client_ids:
                g.client_ids.remove(client_id)
                break

    def set_name(self, group_id: str, name: str) -> None:
        g = self.ensure_group(group_id)
        g.name = name
