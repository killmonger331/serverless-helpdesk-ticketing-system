import json
import logging
import os
from typing import Any
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)
ses = boto3.client("ses")
SENDER_EMAIL = os.environ["SENDER_EMAIL"]
def lambda_handler(event: dict[str, Any], context: Any) -> None:
    logger.info("Notification event received.")
    records = event.get("Records", [])
    for record in records:
        try:
            sns_message = record["Sns"]["Message"]
            notification = json.loads(sns_message)
            event_type = notification.get("eventType")
            if event_type == "TICKET_CREATED":
                send_ticket_created_email(notification)
            elif event_type == "TICKET_STATUS_CHANGED":
                send_status_changed_email(notification)
            else:
                logger.info(
                    "SES event received: %s",
                    json.dumps(notification),
                )
        except Exception:
            logger.exception(
                "Failed to process notification record."
            )
            raise

def send_ticket_created_email(notification: dict[str, Any]) -> None:
    ticket_id = notification["ticketId"]
    requester_email = notification["requesterEmail"]
    status = notification["status"]

    subject = f"Help Desk Ticket Created - {ticket_id}"

    body = (
        f"Your help desk ticket has been created successfully.\n\n"
        f"Ticket ID: {ticket_id}\n"
        f"Status: {status}\n\n"
        f"Please keep your ticket ID for reference."
    )

    send_email(
        recipient=requester_email,
        subject=subject,
        body=body,
    )

def send_status_changed_email(notification: dict[str, Any]) -> None:
    ticket_id = notification["ticketId"]
    requester_email = notification["requesterEmail"]
    previous_status = notification["previousStatus"]
    new_status = notification["newStatus"]
    subject = f"Help Desk Ticket Updated - {ticket_id}"
    body = (
        f"The status of your help desk ticket has changed.\n\n"
        f"Ticket ID: {ticket_id}\n"
        f"Previous status: {previous_status}\n"
        f"New status: {new_status}"
    )
    send_email(
        recipient=requester_email,
        subject=subject,
        body=body,
    )

def send_email(
    recipient: str,
    subject: str,
    body: str,
) -> None:
    try:
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                "ToAddresses": [recipient],
            },
            Message={
                "Subject": {
                    "Data": subject,
                },
                "Body": {
                    "Text": {
                        "Data": body,
                    },
                },
            },
            ConfigurationSetName="help-desk-notifications",
        )

        logger.info(
            "Email sent successfully. MessageId=%s",
            response.get("MessageId"),
        )

    except Exception:
        logger.exception(
            "SES failed to send email to %s.",
            recipient,
        )
        raise