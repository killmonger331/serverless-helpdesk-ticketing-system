import json

from shared.responses import api_response
from shared.ticket_repository import get_ticket


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        ticket_id = body.get("ticketId", "").strip()
        requester_email = body.get("requesterEmail", "").strip().lower()
        if not ticket_id or not requester_email:
            return api_response(400, {"message": "Ticket ID and requester email are required."})
        ticket = get_ticket(ticket_id)
        if not ticket:
            return api_response(404, {"message": ("Ticket not found or requester information " "does not match.")})
        stored_email = (ticket.get("requesterEmail", "").strip().lower())
        if requester_email != stored_email:
            return api_response(404, { "message": "Ticket not found or requester information does not match." })
        customer_ticket = {
            "ticketId": ticket.get("ticketId"),
            "title": ticket.get("title"),
            "status": ticket.get("status"),
            "priority": ticket.get("priority"),
            "createdAt": ticket.get("createdAt"),
            "updatedAt": ticket.get("updatedAt"),
        }
        return api_response(200, {"ticket": customer_ticket})
    except json.JSONDecodeError:
        return api_response(400, {"message": "Request body must contain valid JSON."})
    except Exception as exc:
        print(f"Customer ticket lookup failed: {type(exc).__name__}: {exc}")
        return api_response(500, {"message": "Unable to look up ticket."})