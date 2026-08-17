from uuid import UUID, uuid4

from application.ports.auto_contributions_port import AutoContributionsPort
from application.ports.entity_port import EntityPort
from application.ports.historic_port import HistoricPort
from application.ports.position_port import PositionPort
from application.ports.transaction_port import TransactionPort
from domain.auto_contributions import ContributionQueryRequest
from domain.entity import Entity, EntityOrigin, EntityType
from domain.exception.exceptions import EntityNameAlreadyExists, EntityNotFound, MissingFieldsError
from domain.global_position import PositionQueryRequest
from domain.use_cases.manage_manual_entities import ManageManualEntities


class ManualEntityNotEmpty(Exception):
    pass


class ManageManualEntitiesImpl(ManageManualEntities):
    def __init__(
        self,
        entity_port: EntityPort,
        position_port: PositionPort,
        transaction_port: TransactionPort,
        historic_port: HistoricPort,
        auto_contributions_port: AutoContributionsPort,
    ):
        self._entity_port = entity_port
        self._position_port = position_port
        self._transaction_port = transaction_port
        self._historic_port = historic_port
        self._auto_contributions_port = auto_contributions_port

    async def _validate_name(self, name: str, current_id: UUID | None = None) -> str:
        normalized = name.strip()
        if not normalized:
            raise MissingFieldsError(["name"])
        for entity in await self._entity_port.get_all():
            if entity.origin == EntityOrigin.MANUAL and entity.id != current_id:
                if entity.name.casefold() == normalized.casefold():
                    raise EntityNameAlreadyExists(normalized)
        return normalized

    async def create(self, name: str) -> Entity:
        normalized = await self._validate_name(name)
        entity = Entity(
            id=uuid4(),
            name=normalized,
            natural_id=None,
            type=EntityType.FINANCIAL_INSTITUTION,
            origin=EntityOrigin.MANUAL,
            icon_url=None,
        )
        await self._entity_port.insert(entity)
        return entity

    async def rename(self, entity_id: UUID, name: str) -> Entity:
        entity = await self._entity_port.get_by_id(entity_id)
        if entity is None or entity.origin != EntityOrigin.MANUAL:
            raise EntityNotFound(entity_id)
        entity.name = await self._validate_name(name, entity_id)
        await self._entity_port.update(entity)
        return entity

    async def delete(self, entity_id: UUID) -> None:
        entity = await self._entity_port.get_by_id(entity_id)
        if entity is None or entity.origin != EntityOrigin.MANUAL:
            raise EntityNotFound(entity_id)

        positions = await self._position_port.get_last_grouped_by_entity(
            PositionQueryRequest(entities=[entity_id])
        )
        transactions = await self._transaction_port.get_by_entity(entity_id)
        historic = await self._historic_port.get_manual_by_entity(entity_id)
        contributions = await self._auto_contributions_port.get_all_grouped_by_entity(
            ContributionQueryRequest(entities=[entity_id])
        )
        has_transactions = bool(
            (transactions.investment or []) or (transactions.account or [])
        )
        if positions or has_transactions or historic or contributions:
            raise ManualEntityNotEmpty(entity_id)
        await self._entity_port.delete_by_id(entity_id)
