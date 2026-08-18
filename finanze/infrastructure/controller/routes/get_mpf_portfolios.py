from quart import jsonify


async def get_mpf_portfolios(get_mpf_portfolios_uc):
    summaries = await get_mpf_portfolios_uc.execute()
    return jsonify({"portfolios": summaries}), 200
