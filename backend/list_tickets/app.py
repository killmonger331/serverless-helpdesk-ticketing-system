import logging
from typing import Any

from shared.responses import api_response
from shared.ticket_repository import list_tickets


logger = logging.getLogger()
logger.setLevel(logging.INFO)


STATUS_ORDER = {
    "OPEN": 0,
    "IN_PROGRESS": 1,
    "RESOLVED": 2,
    "CLOSED": 3,
}


def ticket_sort_key(ticket: dict[str, Any]) -> tuple:
    """
    Place active tickets first.

    Within each status group, display newer tickets before older tickets.
    """
    status = ticket.get("status", "OPEN")
    created_at = ticket.get("createdAt", "")

    return (
        STATUS_ORDER.get(status, 99),
        created_at,
    )


def lambda_handler(event: dict[str, Any], context: Any) -> dict:
    try:
        tickets = list_tickets()

        # Sort newest first, then group based on status.
        tickets.sort(
            key=lambda ticket: ticket.get("createdAt", ""),
            reverse=True,
        )

        tickets.sort(
            key=lambda ticket: STATUS_ORDER.get(
                ticket.get("status", "OPEN"),
                99,
            )
        )

        logger.info(
            "Tickets listed successfully",
            extra={"ticketCount": len(tickets)},
        )

        return api_response(
            200,
            {
                "tickets": tickets,
                "count": len(tickets),
            },
        )

    except Exception:
        logger.exception("Unexpected error while listing tickets")

        return api_response(
            500,
            {
                "message": "An unexpected server error occurred."
            },
        )