from quart import jsonify, request


async def get_mpf_fund_quotes(get_mpf_fund_quotes_uc):
    scheme = request.args.get("scheme")
    quotes = await get_mpf_fund_quotes_uc.execute(scheme)
    return jsonify({"quotes": quotes}), 200
