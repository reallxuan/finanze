import abc

from domain.mpf import UpdateMpfPortfolioRequest


class UpdateMpfPortfolio(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, request: UpdateMpfPortfolioRequest):
        raise NotImplementedError
