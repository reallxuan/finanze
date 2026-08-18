from uuid import UUID

from quart import jsonify


async def get_mpf_contributions(get_mpf_contributions_uc, portfolio_id: str):
    try:
        pid = UUID(portfolio_id)
    except (ValueError, TypeError):
        return jsonify(
            {"code": "INVALID_REQUEST", "message": "Invalid portfolio ID"}
        ), 400

    contributions = await get_mpf_contributions_uc.execute(pid)
    return jsonify({"contributions": contributions}), 200
