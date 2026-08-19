import abc
from uuid import UUID

from domain.dezimal import Dezimal


class AdjustAccountBalance(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(
        self, entity_id: UUID, account_name: str, delta: Dezimal
    ) -> bool:
        """Adjust a manual account's balance by delta.

        Returns True if an account matching (entity_id, account_name) was
        found and updated, False otherwise (no-op).
        """
        raise NotImplementedError
