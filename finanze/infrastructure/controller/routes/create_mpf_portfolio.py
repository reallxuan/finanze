from uuid import UUID

from quart import jsonify, request

from domain.mpf import CreateMpfPortfolioRequest
from infrastructure.controller.mappers.mpf_mapper import map_allocation_targets


async def create_mpf_portfolio(create_mpf_portfolio_uc):
    body = await request.get_json()

    try:
        request_obj = CreateMpfPortfolioRequest(
            entity_id=UUID(body["entity_id"]),
            name=body["name"],
            scheme=body.get("scheme") or "MPF",
            currency=body.get("currency") or "HKD",
            target_allocation=map_allocation_targets(
                body.get("target_allocation") or []
            ),
        )
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    try:
        portfolio = await create_mpf_portfolio_uc.execute(request_obj)
    except ValueError as e:
        return jsonify({"code": "INVALID_REQUEST", "message": str(e)}), 400

    return jsonify(portfolio), 201
