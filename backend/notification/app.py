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
                logger.warning(
                    "Unknown notification event type: %s",
                    event_type,
                )
        except Exception:
            logger.exception(
                "Failed to process notification record."
            )
            raise