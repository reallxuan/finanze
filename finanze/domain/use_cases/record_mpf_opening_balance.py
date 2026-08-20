import abc

from domain.mpf import MpfContribution, RecordMpfOpeningBalanceRequest


class RecordMpfOpeningBalance(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(
        self, request: RecordMpfOpeningBalanceRequest
    ) -> MpfContribution:
        raise NotImplementedError
