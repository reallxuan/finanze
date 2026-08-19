from datetime import date
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from domain.dezimal import Dezimal
from domain.instrument import InstrumentDataRequest, InstrumentType
from infrastructure.client.instrument.yfinance_client import YFinanceClient


def _history_df():
    index = pd.to_datetime(["2024-01-02", "2024-01-03"])
    return pd.DataFrame(
        {
            "Open": [100.0, 101.0],
            "High": [102.0, 103.0],
            "Low": [99.0, 100.5],
            "Close": [101.5, 102.5],
            "Volume": [1000, 1500],
        },
        index=index,
    )


@pytest.mark.asyncio
async def test_get_history_maps_dataframe_rows_to_candles():
    client = YFinanceClient()
    request = InstrumentDataRequest(type=InstrumentType.STOCK, ticker="AAPL")

    mock_ticker = MagicMock()
    mock_ticker.history.return_value = _history_df()
    mock_ticker.fast_info = {"currency": "USD"}

    with (
        patch.object(client, "_resolve_symbol", return_value="AAPL"),
        patch(
            "infrastructure.client.instrument.yfinance_client.yf.Ticker",
            return_value=mock_ticker,
        ),
    ):
        result = await client.get_history(request, "1mo", "1d")

    assert result is not None
    assert result.symbol == "AAPL"
    assert result.currency == "USD"
    assert result.interval == "1d"
    assert len(result.candles) == 2
    assert result.candles[0].date == date(2024, 1, 2)
    assert result.candles[0].open == Dezimal(100.0)
    assert result.candles[0].volume == 1000
    mock_ticker.history.assert_called_once_with(
        period="1mo", interval="1d", auto_adjust=False
    )


@pytest.mark.asyncio
async def test_get_history_prefers_ticker_over_isin_when_resolving():
    client = YFinanceClient()
    request = InstrumentDataRequest(
        type=InstrumentType.ETF, isin="US9229087690", ticker="VOO"
    )

    mock_ticker = MagicMock()
    mock_ticker.history.return_value = _history_df()
    mock_ticker.fast_info = {"currency": "USD"}

    with (
        patch.object(
            client, "_resolve_symbol", return_value="VOO"
        ) as mock_resolve,
        patch(
            "infrastructure.client.instrument.yfinance_client.yf.Ticker",
            return_value=mock_ticker,
        ),
    ):
        result = await client.get_history(request, "1mo", "1d")

    assert result is not None
    mock_resolve.assert_awaited_once_with("VOO", InstrumentType.ETF)


@pytest.mark.asyncio
async def test_get_history_returns_none_when_symbol_unresolved():
    client = YFinanceClient()
    request = InstrumentDataRequest(type=InstrumentType.STOCK, ticker="UNKNOWN")

    with patch.object(client, "_resolve_symbol", return_value=None):
        result = await client.get_history(request, "1mo", "1d")

    assert result is None


@pytest.mark.asyncio
async def test_get_history_returns_none_when_dataframe_empty():
    client = YFinanceClient()
    request = InstrumentDataRequest(type=InstrumentType.STOCK, ticker="AAPL")

    mock_ticker = MagicMock()
    mock_ticker.history.return_value = pd.DataFrame()

    with (
        patch.object(client, "_resolve_symbol", return_value="AAPL"),
        patch(
            "infrastructure.client.instrument.yfinance_client.yf.Ticker",
            return_value=mock_ticker,
        ),
    ):
        result = await client.get_history(request, "1mo", "1d")

    assert result is None
