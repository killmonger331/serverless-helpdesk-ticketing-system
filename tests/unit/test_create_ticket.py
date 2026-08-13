import json
import os
from unittest.mock import patch

os.environ["NOTIFICATION_TOPIC_ARN"] = "arn:aws:sns:us-east-1:123456789012:test-topic"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

from create_ticket import app

@patch("create_ticket.app.publish_ticket_created")
@patch("create_ticket.app.create_ticket")
@patch("create_ticket.app.validate_create_ticket")
def test_create_ticket_success(
    mock_validate,
    mock_create_ticket,
    mock_publish,
):
    mock_validate.return_value = {
        "requesterEmail": "customer@example.com",
        "title": "Network issue",
        "description": "Unable to connect to the network.",
    }

    event = {
        "body": json.dumps(
            {
                "requesterEmail": "customer@example.com",
                "title": "Network issue",
                "description": "Unable to connect to the network.",
            }
        )
    }

    response = app.lambda_handler(event, None)

    assert response["statusCode"] == 201

    body = json.loads(response["body"])

    assert body["status"] == "OPEN"
    assert body["ticketId"].startswith("TKT-")

    mock_create_ticket.assert_called_once()
    mock_publish.assert_called_once()