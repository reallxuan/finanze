from quart import jsonify

from domain.use_cases.update_tracked_quotes import UpdateTrackedQuotes


async def update_tracked_quotes(update_tracked_quotes_uc: UpdateTrackedQuotes):
    result = await update_tracked_quotes_uc.execute()
    return (
        jsonify(
            {
                "hadTracked": result.had_tracked,
                "changed": result.changed,
                "changedEntities": [str(eid) for eid in result.changed_entities],
                "throttled": result.throttled,
                "updatedAt": result.updated_at.isoformat() if result.updated_at else None,
                "nextAllowedAt": result.next_allowed_at.isoformat() if result.next_allowed_at else None,
            }
        ),
        200,
    )
