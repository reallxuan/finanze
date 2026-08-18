import abc
from uuid import UUID


class DeleteMpfPortfolio(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, portfolio_id: UUID):
        raise NotImplementedError
