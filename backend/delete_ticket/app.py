import logging
from typing import Any

from botocore.exceptions import ClientError

from shared.responses import api_response
from shared.ticket_repository import (
    delete_ticket,
    get_ticket,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)


DELETABLE_STATUSES = {
    "RESOLVED",
    "CLOSED",
}


def lambda_handler(
    event: dict[str, Any],
    context: Any,
) -> dict[str, Any]:
    try:
        path_parameters = event.get("pathParameters") or {}
        ticket_id = path_parameters.get("ticketId")

        if not ticket_id:
            return api_response(
                400,
                {"message": "ticketId is required."},
            )

        ticket = get_ticket(ticket_id)

        if not ticket:
            return api_response(
                404,
                {"message": "Ticket not found."},
            )

        status = ticket.get("status")

        if status not in DELETABLE_STATUSES:
            return api_response(
                409,
                {
                    "message": (
                        "Only resolved or closed tickets "
                        "can be deleted."
                    )
                },
            )

        deleted_ticket = delete_ticket(ticket_id)

        if not deleted_ticket:
            return api_response(
                404,
                {"message": "Ticket not found."},
            )

        logger.info(
            "Deleted ticket %s",
            ticket_id,
        )

        return api_response(
            200,
            {
                "message": "Ticket deleted successfully.",
                "ticket": deleted_ticket,
            },
        )

    except ClientError as exc:
        error_code = exc.response.get(
            "Error",
            {},
        ).get("Code")

        if error_code == "ConditionalCheckFailedException":
            return api_response(
                404,
                {"message": "Ticket not found."},
            )

        logger.exception(
            "DynamoDB error while deleting ticket."
        )

        return api_response(
            500,
            {"message": "Unable to delete ticket."},
        )

    except Exception:
        logger.exception(
            "Unexpected error while deleting ticket."
        )

        return api_response(
            500,
            {"message": "Internal server error."},
        )