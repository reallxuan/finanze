from uuid import UUID

from quart import jsonify


async def delete_mpf_contribution(delete_mpf_contribution_uc, contribution_id: str):
    try:
        cid = UUID(contribution_id)
    except (ValueError, TypeError):
        return jsonify(
            {"code": "INVALID_REQUEST", "message": "Invalid contribution ID"}
        ), 400

    await delete_mpf_contribution_uc.execute(cid)
    return "", 204
