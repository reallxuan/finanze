from typing import Optional

from application.ports.instrument_info_provider import InstrumentInfoProvider
from domain.instrument import InstrumentDataRequest, InstrumentHistory
from domain.use_cases.get_instrument_history import GetInstrumentHistory


class GetInstrumentHistoryImpl(GetInstrumentHistory):
    def __init__(self, provider: InstrumentInfoProvider):
        self._provider = provider

    async def execute(
        self, request: InstrumentDataRequest, range_: str, interval: str
    ) -> Optional[InstrumentHistory]:
        return await self._provider.get_history(request, range_, interval)
