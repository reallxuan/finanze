from datetime import date
from unittest.mock import AsyncMock

import pytest

from application.ports.instrument_info_provider import InstrumentInfoProvider
from application.use_cases.get_instrument_history import GetInstrumentHistoryImpl
from domain.dezimal import Dezimal
from domain.instrument import (
    InstrumentCandle,
    InstrumentDataRequest,
    InstrumentHistory,
    InstrumentType,
)


@pytest.mark.asyncio
async def test_execute_passes_through_request_range_and_interval():
    provider = AsyncMock(spec=InstrumentInfoProvider)
    expected = InstrumentHistory(
        symbol="AAPL",
        currency="USD",
        interval="1d",
        candles=(
            InstrumentCandle(
                date=date(2024, 1, 1),
                open=Dezimal("1"),
                high=Dezimal("2"),
                low=Dezimal("0.5"),
                close=Dezimal("1.5"),
            ),
        ),
    )
    provider.get_history = AsyncMock(return_value=expected)
    use_case = GetInstrumentHistoryImpl(provider)
    request = InstrumentDataRequest(type=InstrumentType.STOCK, ticker="AAPL")

    result = await use_case.execute(request, "1y", "1d")

    assert result == expected
    provider.get_history.assert_awaited_once_with(request, "1y", "1d")


@pytest.mark.asyncio
async def test_execute_returns_none_when_provider_returns_none():
    provider = AsyncMock(spec=InstrumentInfoProvider)
    provider.get_history = AsyncMock(return_value=None)
    use_case = GetInstrumentHistoryImpl(provider)
    request = InstrumentDataRequest(type=InstrumentType.MUTUAL_FUND, isin="IE00TEST")

    result = await use_case.execute(request, "1y", "1d")

    assert result is None
