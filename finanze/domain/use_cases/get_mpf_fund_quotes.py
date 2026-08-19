import abc
from typing import Optional

from domain.mpf import MpfFundQuote


class GetMpfFundQuotes(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def execute(self, scheme: Optional[str] = None) -> list[MpfFundQuote]:
        raise NotImplementedError
