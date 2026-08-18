import abc
from uuid import UUID


class DeleteMpfContribution(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, contribution_id: UUID):
        raise NotImplementedError
