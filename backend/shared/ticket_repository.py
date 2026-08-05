# repository; data access layer; responsible for all communication between application (Lambda/business logic) and DynamoDB
import os
from typing import Any
import boto3

dynamodb = boto3.resource("dynamodb")

def get_ticket_table():
    table_name = os.environ["TICKET_TABLE_NAME"]
    return dynamodb.Table(table_name)

def create_ticket(ticket: dict[str, Any]) -> None:
    table = get_ticket_table()

    table.put_item(
        Item=ticket,
        ConditionExpression="attribute_not_exists(ticketId)",
    )

def list_tickets() -> list[dict[str, Any]]:
    """
    Return all tickets currently stored in the DynamoDB table.

    DynamoDB Scan is acceptable for this small portfolio project.
    A production system with many tickets would typically use indexes,
    pagination, and Query operations instead.
    """
    table = get_ticket_table()

    response = table.scan()
    tickets = response.get("Items", [])

    # Continue scanning if DynamoDB returns a paginated response.
    while "LastEvaluatedKey" in response:
        response = table.scan(
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        tickets.extend(response.get("Items", []))

    return tickets




