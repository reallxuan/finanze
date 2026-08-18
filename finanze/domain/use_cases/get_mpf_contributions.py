import abc
from uuid import UUID

from domain.mpf import MpfContribution


class GetMpfContributions(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, portfolio_id: UUID) -> list[MpfContribution]:
        raise NotImplementedError
