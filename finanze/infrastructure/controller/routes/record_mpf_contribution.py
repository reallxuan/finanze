from datetime import datetime
from uuid import UUID

from dateutil.tz import tzlocal
from quart import jsonify, request

from domain.dezimal import Dezimal
from domain.mpf import RecordMpfContributionRequest


def _parse_datetime(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tzlocal())
    return dt


async def record_mpf_contribution(record_mpf_contribution_uc, portfolio_id: str):
    try:
        pid = UUID(portfolio_id)
    except (ValueError, TypeError):
        return jsonify(
            {"code": "INVALID_REQUEST", "message": "Invalid portfolio ID"}
        ), 400

    body = await request.get_json()

    try:
        request_obj = RecordMpfContributionRequest(
            portfolio_id=pid,
            date=_parse_datetime(body["date"]),
            total_amount=Dezimal(str(body["total_amount"])),
            note=body.get("note"),
        )
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    try:
        contribution = await record_mpf_contribution_uc.execute(request_obj)
    except ValueError as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    return jsonify(contribution), 201
