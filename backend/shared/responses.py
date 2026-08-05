## response layer, this determines how Lambda should send a response back to the client
import json
from typing import Any
from decimal import Decimal

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH",
}
class DynamoDBJSONEncoder(json.JSONEncoder):
    """
    Convert DynamoDB Decimal values into normal JSON numbers.
    """
    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)

            return float(obj)

        return super().default(obj)

def api_response(status_code: int, body: dict[str, Any]) -> dict:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, cls=DynamoDBJSONEncoder),
    }


