from uuid import UUID

from quart import jsonify, request

from domain.use_cases.manage_manual_entities import (
    ManageManualEntities,
)
from application.use_cases.manage_manual_entities import ManualEntityNotEmpty
from domain.exception.exceptions import EntityNameAlreadyExists, EntityNotFound, MissingFieldsError


async def create_manual_entity(use_case: ManageManualEntities):
    body = await request.get_json()
    if not isinstance(body, dict):
        return jsonify({"code": "INVALID_REQUEST", "message": "Expected a JSON object"}), 400
    try:
        entity = await use_case.create(str(body.get("name") or ""))
    except MissingFieldsError:
        return jsonify({"code": "MISSING_FIELDS", "missing": ["name"]}), 400
    except EntityNameAlreadyExists as error:
        return jsonify({"code": "ENTITY_NAME_EXISTS", "message": str(error)}), 409
    return jsonify({"id": str(entity.id), "name": entity.name, "origin": entity.origin}), 201


async def rename_manual_entity(use_case: ManageManualEntities, entity_id: str):
    body = await request.get_json()
    if not isinstance(body, dict):
        return jsonify({"code": "INVALID_REQUEST", "message": "Expected a JSON object"}), 400
    try:
        entity = await use_case.rename(UUID(entity_id), str(body.get("name") or ""))
    except ValueError:
        return jsonify({"code": "INVALID_REQUEST", "message": "Invalid entity id"}), 400
    except MissingFieldsError:
        return jsonify({"code": "MISSING_FIELDS", "missing": ["name"]}), 400
    except EntityNameAlreadyExists as error:
        return jsonify({"code": "ENTITY_NAME_EXISTS", "message": str(error)}), 409
    except EntityNotFound:
        return jsonify({"code": "NOT_FOUND", "message": "Manual entity not found"}), 404
    return jsonify({"id": str(entity.id), "name": entity.name, "origin": entity.origin}), 200


async def delete_manual_entity(use_case: ManageManualEntities, entity_id: str):
    try:
        await use_case.delete(UUID(entity_id))
    except ValueError:
        return jsonify({"code": "INVALID_REQUEST", "message": "Invalid entity id"}), 400
    except ManualEntityNotEmpty:
        return jsonify({"code": "ENTITY_NOT_EMPTY", "message": "Clear related positions, transactions, and history first"}), 409
    except EntityNotFound:
        return jsonify({"code": "NOT_FOUND", "message": "Manual entity not found"}), 404
    return "", 204
