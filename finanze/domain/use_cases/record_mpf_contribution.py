import abc

from domain.mpf import MpfContribution, RecordMpfContributionRequest


class RecordMpfContribution(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(
        self, request: RecordMpfContributionRequest
    ) -> MpfContribution:
        raise NotImplementedError
