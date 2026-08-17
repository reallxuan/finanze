from abc import ABC, abstractmethod
from uuid import UUID

from domain.entity import Entity


class ManageManualEntities(ABC):
    @abstractmethod
    async def create(self, name: str) -> Entity:
        raise NotImplementedError

    @abstractmethod
    async def rename(self, entity_id: UUID, name: str) -> Entity:
        raise NotImplementedError

    @abstractmethod
    async def delete(self, entity_id: UUID) -> None:
        raise NotImplementedError
