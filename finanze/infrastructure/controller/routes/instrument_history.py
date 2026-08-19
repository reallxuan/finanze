from domain.instrument import InstrumentDataRequest, InstrumentType
from domain.use_cases.get_instrument_history import GetInstrumentHistory
from quart import jsonify, request

_ALLOWED_RANGES = {"1mo", "3mo", "6mo", "1y", "5y", "max"}
_ALLOWED_INTERVALS = {"1d", "1wk", "1mo"}


async def instrument_history(get_instrument_history_uc: GetInstrumentHistory):
    name = request.args.get("name") or None
    isin = request.args.get("isin") or None
    ticker = request.args.get("ticker") or None
    if not any([name, isin, ticker]):
        return jsonify(
            {"message": "At least one of name, isin, or ticker must be provided"}
        ), 400

    raw_type = request.args.get("type")
    if not raw_type:
        return jsonify({"message": "Instrument type must be provided"}), 400

    try:
        ins_type = InstrumentType(raw_type)
    except ValueError:
        return jsonify({"message": f"Invalid instrument type: {raw_type}"}), 400

    range_ = request.args.get("range", "1y")
    interval = request.args.get("interval", "1d")
    if range_ not in _ALLOWED_RANGES:
        return jsonify({"message": f"Invalid range: {range_}"}), 400
    if interval not in _ALLOWED_INTERVALS:
        return jsonify({"message": f"Invalid interval: {interval}"}), 400

    data_request = InstrumentDataRequest(
        name=name,
        isin=isin,
        ticker=ticker,
        type=ins_type,
    )

    history = await get_instrument_history_uc.execute(data_request, range_, interval)
    if history is None or not history.candles:
        return jsonify({"message": "No chart data available"}), 404

    return jsonify(history), 200
