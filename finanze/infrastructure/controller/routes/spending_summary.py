from domain.transactions import SpendingSummaryRequest
from quart import jsonify, request


async def spending_summary(get_spending_summary_uc):
    from_date = request.args.get("from_date")
    to_date = request.args.get("to_date")

    query = SpendingSummaryRequest(
        from_date=from_date,
        to_date=to_date,
    )

    result = await get_spending_summary_uc.execute(query)

    return jsonify(result), 200
