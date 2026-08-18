import abc
from uuid import UUID

from domain.transactions import AccountLedgerResult


class GetAccountLedger(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(
        self, entity_id: UUID, account_name: str
    ) -> AccountLedgerResult:
        raise NotImplementedError
