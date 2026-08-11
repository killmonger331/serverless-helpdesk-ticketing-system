import json
import logging
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

from shared.responses import api_response
from shared.ticket_repository import get_ticket, update_ticket
from shared.validation import ValidationError, validate_update_ticket


logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client("sns")
NOTIFICATION_TOPIC_ARN = os.environ["NOTIFICATION_TOPIC_ARN"]


def publish_status_changed(
    ticket: dict[str, Any],
    previous_status: str,
) -> None:
    event = {
        "eventType": "TICKET_STATUS_CHANGED",
        "ticketId": ticket["ticketId"],
        "requesterEmail": ticket["requesterEmail"],
        "previousStatus": previous_status,
        "newStatus": ticket["status"],
    }

    sns.publish(
        TopicArn=NOTIFICATION_TOPIC_ARN,
        Message=json.dumps(event),
    )


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

        body = event.get("body")

        if body is None:
            return api_response(
                400,
                {"message": "Request body is required."},
            )

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return api_response(
                400,
                {"message": "Request body must contain valid JSON."},
            )
        updates = validate_update_ticket(data)
        current_ticket = get_ticket(ticket_id)
        if not current_ticket:
            return api_response(
                404,
                {"message": "Ticket not found."},
            )
        previous_status = current_ticket["status"]

        updated_ticket = update_ticket(
            ticket_id=ticket_id,
            updates=updates,
        )

        if (
            "status" in updates
            and updated_ticket["status"] != previous_status
        ):
            try:
                publish_status_changed(
                    updated_ticket,
                    previous_status,
                )
            except Exception:
                logger.exception(
                    "Ticket updated, but status notification "
                    "could not be published."
                )
        return api_response(
            200,
            {"ticket": updated_ticket},
        )
    except ValidationError as exc:
        return api_response(
            400,
            {"message": str(exc)},
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")

        if error_code == "ConditionalCheckFailedException":
            return api_response(
                404,
                {"message": "Ticket not found."},
            )
        logger.exception(
            "DynamoDB error while updating ticket."
        )
        return api_response(
            500,
            {"message": "Unable to update ticket."},
        )
    except Exception:
        logger.exception(
            "Unexpected error while updating ticket."
        )
        return api_response(
            500,
            {"message": "Internal server error."},
        )