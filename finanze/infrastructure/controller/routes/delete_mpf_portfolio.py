from uuid import UUID

from quart import jsonify


async def delete_mpf_portfolio(delete_mpf_portfolio_uc, portfolio_id: str):
    try:
        pid = UUID(portfolio_id)
    except (ValueError, TypeError):
        return jsonify(
            {"code": "INVALID_REQUEST", "message": "Invalid portfolio ID"}
        ), 400

    await delete_mpf_portfolio_uc.execute(pid)
    return "", 204
