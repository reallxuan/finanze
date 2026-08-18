from uuid import UUID

from quart import jsonify, request


async def get_account_ledger(get_account_ledger_uc):
    entity_id = request.args.get("entity_id")
    account_name = request.args.get("account_name")
    if not entity_id or not account_name:
        return jsonify({"error": "entity_id and account_name are required"}), 400

    try:
        entity_id = UUID(entity_id)
    except ValueError:
        return jsonify({"error": "Invalid entity_id format"}), 400

    result = await get_account_ledger_uc.execute(entity_id, account_name)

    return jsonify(result), 200
