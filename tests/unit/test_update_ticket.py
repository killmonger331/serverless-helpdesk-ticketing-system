import json
import os

os.environ["NOTIFICATION_TOPIC_ARN"] = "arn:aws:sns:us-east-1:123456789012:test-topic"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"

from update_ticket import app


def test_update_ticket_without_body_returns_400():
    event = {
        "pathParameters": {
            "ticketId": "TKT-12345678"
        }
    }

    response = app.lambda_handler(event, None)

    assert response["statusCode"] == 400

    body = json.loads(response["body"])

    assert body["message"] == "Request body is required."