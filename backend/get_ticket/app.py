import logging
from typing import Any
from shared.responses import api_response
from shared.ticket_repository import get_ticket

logger = logging.getLogger()
logger.setLevel(logging.INFO)
def extract_ticket_id(event: dict[str, Any]) -> str | None:
    path_parameters = event.get("pathParameters") or {}
    ticket_id = path_parameters.get("ticketId")
    if not isinstance(ticket_id, str):
        return None
    ticket_id = ticket_id.strip()
    return ticket_id or None
def lambda_handler(event: dict[str, Any], context: Any) -> dict:
    try:
        ticket_id = extract_ticket_id(event)

        if ticket_id is None:
            return api_response(
                400,
                {
                    "message": "A ticket ID is required.",
                },
            )
        ticket = get_ticket(ticket_id)

        if ticket is None:
            return api_response(
                404,
                {
                    "message": "Ticket not found.",
                    "ticketId": ticket_id,
                },
            )
        logger.info(
            "Ticket retrieved successfully",
            extra={"ticketId": ticket_id},
        )
        return api_response(
            200,
            {
                "ticket": ticket,
            },
        )
    except Exception:
        logger.exception("Unexpected error while retrieving ticket")

        return api_response(
            500,
            {
                "message": "An unexpected server error occurred.",
            },
        )