import json
from unittest.mock import patch

from get_ticket import app

@patch("get_ticket.app.get_ticket")
def test_get_nonexistent_ticket_returns_404(mock_get_ticket):
    mock_get_ticket.return_value = None

    event = {
        "pathParameters": {
            "ticketId": "TKT-DOESNOTEXIST"
        }
    }

    response = app.lambda_handler(event, None)

    assert response["statusCode"] == 404

    body = json.loads(response["body"])

    assert body["message"] == "Ticket not found."
    assert body["ticketId"] == "TKT-DOESNOTEXIST"

    mock_get_ticket.assert_called_once_with("TKT-DOESNOTEXIST")