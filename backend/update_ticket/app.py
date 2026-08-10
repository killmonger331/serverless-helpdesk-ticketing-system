import json
import logging
from typing import Any
from botocore.exceptions import ClientError
from shared.responses import api_response
from shared.ticket_repository import update_ticket
from shared.validation import ValidationError, validate_update_ticket
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        path_parameters = event.get("pathParameters") or {}
        ticket_id = path_parameters.get("ticketId")

        if not ticket_id:
            return api_response(
                400,
                {
                    "message": "ticketId is required.",
                },
            )
        body = event.get("body")
        if body is None:
            return api_response(
                400,
                {
                    "message": "Request body is required.",
                },
            )
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return api_response(
                400,
                {
                    "message": "Request body must contain valid JSON.",
                },
            )

        updates = validate_update_ticket(data)

        updated_ticket = update_ticket(
            ticket_id=ticket_id,
            updates=updates,
        )

        return api_response(
            200,
            {
                "ticket": updated_ticket,
            },
        )

    except ValidationError as exc:
        return api_response(
            400,
            {
                "message": str(exc),
            },
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")

        if error_code == "ConditionalCheckFailedException":
            return api_response(
                404,
                {
                    "message": "Ticket not found.",
                },
            )
        logger.exception("DynamoDB error while updating ticket.")

        return api_response(
            500,
            {
                "message": "Unable to update ticket.",
            },
        )
    except Exception:
        logger.exception("Unexpected error while updating ticket.")
        return api_response(
            500,
            {
                "message": "Internal server error.",
            },
        )