import abc

from domain.mpf import MpfPortfolioSummary


class GetMpfPortfolios(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self) -> list[MpfPortfolioSummary]:
        raise NotImplementedError
