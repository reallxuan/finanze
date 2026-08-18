from typing import Optional

from domain.mpf import MpfFundQuote
from domain.use_cases.get_mpf_fund_quotes import GetMpfFundQuotes
from infrastructure.client.mpf.sun_life_mpf_client import SunLifeMpfClient


class GetMpfFundQuotesImpl(GetMpfFundQuotes):
    def __init__(self, sun_life_mpf_client: SunLifeMpfClient):
        self._client = sun_life_mpf_client

    async def execute(self, scheme: Optional[str] = None) -> list[MpfFundQuote]:
        return await self._client.get_latest_prices(scheme)
