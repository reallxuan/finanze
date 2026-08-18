import logging
from datetime import datetime
from uuid import UUID, uuid4

from dateutil.tz import tzlocal

from application.ports.entity_port import EntityPort
from application.ports.position_port import PositionPort
from application.ports.virtual_import_registry import VirtualImportRegistry
from application.use_cases.manual_position_snapshot import ManualPositionSnapshotWriter
from domain.dezimal import Dezimal
from domain.entity import Feature
from domain.fetch_record import DataSource
from domain.global_position import GlobalPosition, ProductType
from domain.use_cases.adjust_account_balance import AdjustAccountBalance
from domain.virtual_data import VirtualDataSource


class AdjustAccountBalanceImpl(AdjustAccountBalance):
    def __init__(
        self,
        entity_port: EntityPort,
        position_port: PositionPort,
        virtual_import_registry: VirtualImportRegistry,
        snapshot_writer: ManualPositionSnapshotWriter,
    ):
        self._entity_port = entity_port
        self._position_port = position_port
        self._virtual_import_registry = virtual_import_registry
        self._snapshot_writer = snapshot_writer
        self._log = logging.getLogger(__name__)

    async def execute(
        self, entity_id: UUID, account_name: str, delta: Dezimal
    ) -> bool:
        entity = await self._entity_port.get_by_id(entity_id)
        if entity is None:
            self._log.warning(
                f"Cannot adjust balance: entity {entity_id} not found"
            )
            return False

        last_manual_imports = (
            await self._virtual_import_registry.get_last_import_records(
                source=VirtualDataSource.MANUAL
            )
        )
        prior_position_entry = next(
            (
                e
                for e in last_manual_imports
                if e.feature == Feature.POSITION and e.entity_id == entity_id
            ),
            None,
        )
        if prior_position_entry is None:
            self._log.warning(
                f"Cannot adjust balance: no manual position snapshot for entity {entity_id}"
            )
            return False

        prior_position = await self._position_port.get_by_id(
            prior_position_entry.global_position_id
        )
        if prior_position is None:
            return False

        accounts_container = prior_position.products.get(ProductType.ACCOUNT)
        if not (accounts_container and hasattr(accounts_container, "entries")):
            self._log.warning(
                f"Cannot adjust balance: entity {entity_id} has no ACCOUNT positions"
            )
            return False

        target = next(
            (a for a in accounts_container.entries if a.name == account_name),
            None,
        )
        if target is None:
            self._log.warning(
                f"Cannot adjust balance: account '{account_name}' not found for entity {entity_id}"
            )
            return False

        target.total = target.total + delta

        now = datetime.now(tzlocal())
        base_position = GlobalPosition(
            id=uuid4(),
            entity=prior_position.entity,
            date=now,
            products=dict(prior_position.products),
            source=DataSource.MANUAL,
        )

        await self._snapshot_writer.write(entity, base_position)
        return True
