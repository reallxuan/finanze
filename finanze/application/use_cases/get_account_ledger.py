from uuid import UUID

from application.ports.entity_port import EntityPort
from application.ports.position_port import PositionPort
from application.ports.transaction_port import TransactionPort
from application.ports.virtual_import_registry import VirtualImportRegistry
from domain.dezimal import Dezimal
from domain.entity import Feature
from domain.exception.exceptions import EntityNotFound
from domain.global_position import ProductType
from domain.transactions import (
    AccountLedgerEntry,
    AccountLedgerResult,
    account_tx_signed_amount,
)
from domain.use_cases.get_account_ledger import GetAccountLedger
from domain.virtual_data import VirtualDataSource


class GetAccountLedgerImpl(GetAccountLedger):
    def __init__(
        self,
        entity_port: EntityPort,
        position_port: PositionPort,
        transaction_port: TransactionPort,
        virtual_import_registry: VirtualImportRegistry,
    ):
        self._entity_port = entity_port
        self._position_port = position_port
        self._transaction_port = transaction_port
        self._virtual_import_registry = virtual_import_registry

    async def execute(
        self, entity_id: UUID, account_name: str
    ) -> AccountLedgerResult:
        entity = await self._entity_port.get_by_id(entity_id)
        if entity is None:
            raise EntityNotFound(entity_id)

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
            raise ValueError(f"No manual position snapshot for entity {entity_id}")

        prior_position = await self._position_port.get_by_id(
            prior_position_entry.global_position_id
        )
        accounts_container = (
            prior_position.products.get(ProductType.ACCOUNT)
            if prior_position
            else None
        )
        target = next(
            (
                a
                for a in (
                    accounts_container.entries
                    if accounts_container and hasattr(accounts_container, "entries")
                    else []
                )
                if a.name == account_name
            ),
            None,
        )
        if target is None:
            raise ValueError(
                f"Account '{account_name}' not found for entity {entity_id}"
            )

        transactions = await self._transaction_port.get_account_ledger(
            entity_id, account_name
        )

        total_delta = sum(
            (account_tx_signed_amount(tx.type, tx.amount) for tx in transactions),
            Dezimal(0),
        )
        running = target.total - total_delta

        entries = []
        for tx in transactions:
            running = running + account_tx_signed_amount(tx.type, tx.amount)
            entries.append(AccountLedgerEntry(transaction=tx, balance_after=running))

        return AccountLedgerResult(
            account_name=account_name,
            currency=target.currency,
            current_balance=target.total,
            entries=entries,
        )
