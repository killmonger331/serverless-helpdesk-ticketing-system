#first Lambda function to create a ticket in the database
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from shared.responses import api_response
from shared.ticket_repository import create_ticket
from shared.validation import ValidationError, validate_create_ticket

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def parse_request_body(event: dict[str, Any]) -> dict:
    body = event.get("body")

    if body is None:
        raise ValidationError("Request body is required.")

    if isinstance(body, dict):
        return body

    try:
        return json.loads(body)
    except (json.JSONDecodeError, TypeError) as exc:
        raise ValidationError("Request body must contain valid JSON.") from exc

def generate_ticket_id() -> str:
    short_id = uuid.uuid4().hex[:8].upper()
    return f"TKT-{short_id}"

def lambda_handler(event: dict[str, Any], context: Any) -> dict:
    try:
        request_data = parse_request_body(event)
        valid_data = validate_create_ticket(request_data)

        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        ticket_id = generate_ticket_id()

        ticket = {
            "ticketId": ticket_id,
            **valid_data,
            "status": "OPEN",
            "createdAt": now,
            "updatedAt": now,
        }

        create_ticket(ticket)

        logger.info(
            "Ticket created",
            extra={"ticketId": ticket_id},
        )

        return api_response(
            201,
            {
                "message": "Ticket created successfully.",
                "ticketId": ticket_id,
                "status": "OPEN",
            },  
        )
    except Exception:
        logger.exception("Unexpected error while creating ticket")

        return api_response(
            500,
            {
                "message": "An unexpected server error occurred."
            },
        )
        