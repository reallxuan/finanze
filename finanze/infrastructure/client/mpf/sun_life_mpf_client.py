import logging
from datetime import date, datetime
from typing import Any, Optional

from aiocache import cached
from aiocache.serializers import PickleSerializer

from domain.dezimal import Dezimal
from domain.mpf import MpfFundQuote
from infrastructure.client.http.http_session import get_http_session


def _first_list(payload: Any) -> list:
    """Sun Life's internal data service isn't a documented/versioned API — response
    envelopes have been observed to vary. Defensively find the first list of rows
    in the payload, whether it's a bare list or wrapped in a dict."""
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for value in payload.values():
            if isinstance(value, list):
                return value
    return []


def _first_value(payload: Any, keys: list[str]) -> Optional[str]:
    rows = _first_list(payload)
    row = rows[0] if rows else (payload if isinstance(payload, dict) else None)
    if not isinstance(row, dict):
        return None
    for key in keys:
        if key in row and row[key]:
            return row[key]
    return None


def _parse_valuation_date(raw: str) -> date:
    return datetime.strptime(raw, "%d/%m/%Y").date()


class SunLifeMpfClient:
    BASE_URL = "https://www.sunlife.com.hk/webservice/getmpforsofunddata"
    TIMEOUT = 10
    CACHE_TTL = 60 * 60

    DEFAULT_SCHEME = "MPF"

    def __init__(self):
        self._log = logging.getLogger(__name__)
        self._session = get_http_session()

    @cached(
        ttl=CACHE_TTL,
        key_builder=lambda f, self, scheme=None, **kwargs: f"sun_life_mpf_quotes:{scheme or SunLifeMpfClient.DEFAULT_SCHEME}",
        skip_cache_func=lambda result: not result,
        serializer=PickleSerializer(),
    )
    async def get_latest_prices(
        self, scheme: Optional[str] = None
    ) -> list[MpfFundQuote]:
        scheme = scheme or self.DEFAULT_SCHEME
        try:
            valuation_date = await self._get_last_valuation_date(scheme)
            if valuation_date is None:
                return []
            return await self._get_daily_prices(scheme, valuation_date)
        except Exception as e:
            self._log.error(f"Failed to fetch Sun Life MPF prices: {e}")
            return []

    async def _get_last_valuation_date(self, scheme: str) -> Optional[date]:
        payload = await self._post(
            {
                "domainAndUserName": "hkportal",
                "sqlKey": "MPF_LAST_VALUATION_DT",
                "sqlParams": [scheme],
            }
        )
        raw = _first_value(payload, ["VALUATION_DT", "valuation_dt", "LAST_VALUATION_DT"])
        if not raw:
            return None
        return _parse_valuation_date(raw)

    async def _get_daily_prices(
        self, scheme: str, valuation_date: date
    ) -> list[MpfFundQuote]:
        payload = await self._post(
            {
                "domainAndUserName": "hkportal",
                "sqlKey": "MPF_DAILYPRICE",
                "sqlParams": [valuation_date.strftime("%Y-%m-%d"), scheme],
            }
        )
        rows = _first_list(payload)
        quotes = []
        for row in rows:
            try:
                quotes.append(
                    MpfFundQuote(
                        fund_cd=row["FUND_CD"],
                        fund_class=row.get("FUND_CLASS") or "",
                        description_en=row.get("FUND_DESCRIPTION_EN") or "",
                        description_zh=row.get("FUND_DESCRIPTION_ZH") or "",
                        category=row.get("PRODUCT_CATEGORY_EN") or "",
                        nav=Dezimal(str(row["NAV"])),
                        valuation_date=_parse_valuation_date(row["VALUATION_DT"])
                        if row.get("VALUATION_DT")
                        else valuation_date,
                    )
                )
            except (KeyError, ValueError) as e:
                self._log.warning(f"Skipping malformed Sun Life MPF fund row: {e}")
        return quotes

    async def _post(self, body: dict) -> Any:
        response = await self._session.post(
            self.BASE_URL, json=body, timeout=self.TIMEOUT
        )
        if not response.ok:
            body_text = await response.text()
            self._log.error(f"Sun Life MPF request failed: {body_text}")
            response.raise_for_status()
        return await response.json()
