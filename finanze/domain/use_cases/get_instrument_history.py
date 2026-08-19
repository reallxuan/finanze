import abc
from typing import Optional

from domain.instrument import InstrumentDataRequest, InstrumentHistory


class GetInstrumentHistory(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(
        self, request: InstrumentDataRequest, range_: str, interval: str
    ) -> Optional[InstrumentHistory]:
        raise NotImplementedError
