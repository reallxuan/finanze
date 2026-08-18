import abc

from domain.transactions import SpendingSummaryRequest, SpendingSummaryResult


class GetSpendingSummary(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, query: SpendingSummaryRequest) -> SpendingSummaryResult:
        pass
