import json
import logging
from datetime import date
from typing import Optional

import js
from aiocache import cached

from domain.dezimal import Dezimal
from domain.instrument import (
    InstrumentCandle,
    InstrumentDataRequest,
    InstrumentHistory,
    InstrumentInfo,
    InstrumentOverview,
    InstrumentType,
)


class YFinanceClient:
    def __init__(self):
        self._log = logging.getLogger(__name__)

    async def lookup(self, request: InstrumentDataRequest) -> list[InstrumentOverview]:
        query = request.isin or request.ticker or request.name
        if not query:
            return []

        try:
            raw = await js.jsBridge.yahooFinance.lookup(query, request.type.value)
            items = json.loads(raw)
        except Exception:
            self._log.exception("yahooFinance bridge lookup failed")
            return []

        results: list[InstrumentOverview] = []
        for item in items:
            price = item.get("price")
            price = round(Dezimal(price), 2) if price is not None else None

            results.append(
                InstrumentOverview(
                    isin=None,
                    name=item.get("name"),
                    currency=item.get("currency"),
                    symbol=item.get("symbol"),
                    market=item.get("exchange"),
                    price=price,
                    type=self._parse_type(item.get("quoteType")) or request.type,
                )
            )

        return results

    @cached(ttl=60, skip_cache_func=lambda r: r is None)
    async def get_instrument_info(
        self, query: str, instrument_type: InstrumentType
    ) -> Optional[InstrumentInfo]:
        if not query:
            return None

        try:
            raw = await js.jsBridge.yahooFinance.getInstrumentInfo(
                query, instrument_type.value
            )
            data = json.loads(raw)
        except Exception:
            self._log.exception("yahooFinance bridge getInstrumentInfo failed")
            return None

        if data is None:
            return None

        resolved_type = self._parse_type(data.get("type")) or instrument_type

        return InstrumentInfo(
            name=data["name"],
            currency=data["currency"],
            type=resolved_type,
            price=Dezimal(data["price"]),
            symbol=data.get("symbol"),
        )

    @cached(ttl=300, skip_cache_func=lambda r: r is None)
    async def get_history(
        self, request: InstrumentDataRequest, range_: str, interval: str
    ) -> Optional[InstrumentHistory]:
        # Prefer the ticker over the ISIN: Yahoo's search resolves a plain
        # ticker far more reliably than an ISIN (which often returns no
        # result, or a result whose quoteType doesn't match, so the
        # exact-match fast path never fires and resolution silently fails).
        query = request.ticker or request.isin or request.name
        if not query:
            return None

        try:
            raw = await js.jsBridge.yahooFinance.getInstrumentHistory(
                query, request.type.value, range_, interval
            )
            data = json.loads(raw)
        except Exception:
            self._log.exception("yahooFinance bridge getInstrumentHistory failed")
            return None

        if data is None:
            return None

        candles = tuple(
            InstrumentCandle(
                date=date.fromisoformat(c["date"]),
                open=Dezimal(c["open"]),
                high=Dezimal(c["high"]),
                low=Dezimal(c["low"]),
                close=Dezimal(c["close"]),
                volume=c.get("volume"),
            )
            for c in data.get("candles", [])
        )

        return InstrumentHistory(
            symbol=data.get("symbol", query),
            currency=data.get("currency") or "",
            interval=interval,
            candles=candles,
        )

    @staticmethod
    def _parse_type(value: Optional[str]) -> Optional[InstrumentType]:
        if not value:
            return None
        try:
            return InstrumentType(value)
        except ValueError:
            return None
