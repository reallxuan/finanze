from uuid import UUID

from quart import jsonify, request

from domain.mpf import UpdateMpfPortfolioRequest
from infrastructure.controller.mappers.mpf_mapper import map_allocation_targets


async def update_mpf_portfolio(update_mpf_portfolio_uc, portfolio_id: str):
    try:
        pid = UUID(portfolio_id)
    except (ValueError, TypeError):
        return jsonify(
            {"code": "INVALID_REQUEST", "message": "Invalid portfolio ID"}
        ), 400

    body = await request.get_json()

    try:
        request_obj = UpdateMpfPortfolioRequest(
            id=pid,
            name=body["name"],
            target_allocation=map_allocation_targets(
                body.get("target_allocation") or []
            ),
        )
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    try:
        await update_mpf_portfolio_uc.execute(request_obj)
    except ValueError as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    return "", 204
