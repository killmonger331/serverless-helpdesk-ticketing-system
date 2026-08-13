import json
from unittest.mock import patch

from list_tickets import app


@patch("list_tickets.app.list_tickets")
def test_list_tickets_success(mock_list_tickets):
    mock_list_tickets.return_value = [
        {
            "ticketId": "TKT-11111111",
            "status": "OPEN",
            "createdAt": "2026-08-12T10:00:00Z",
        },
        {
            "ticketId": "TKT-22222222",
            "status": "CLOSED",
            "createdAt": "2026-08-11T10:00:00Z",
        },
    ]

    response = app.lambda_handler({}, None)

    assert response["statusCode"] == 200

    body = json.loads(response["body"])

    assert body["count"] == 2
    assert len(body["tickets"]) == 2
    assert body["tickets"][0]["ticketId"] == "TKT-11111111"

    mock_list_tickets.assert_called_once()