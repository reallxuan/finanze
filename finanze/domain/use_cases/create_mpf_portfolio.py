import abc

from domain.mpf import CreateMpfPortfolioRequest, MpfPortfolio


class CreateMpfPortfolio(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, request: CreateMpfPortfolioRequest) -> MpfPortfolio:
        raise NotImplementedError
