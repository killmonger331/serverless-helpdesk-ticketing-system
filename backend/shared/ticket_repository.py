# repository; data access layer; responsible for all communication between application (Lambda/business logic) and DynamoDB
import os
from typing import Any
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb")

def get_ticket_table():
    table_name = os.environ["TICKETS_TABLE_NAME"]
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

def get_ticket(ticket_id: str) -> dict[str, Any] | None:
    table = get_ticket_table()

    response = table.get_item(
        Key={
            "ticketId": ticket_id,
        }
    )

    return response.get("Item")

def update_ticket(
    ticket_id: str,
    updates: dict[str, Any],
) -> dict[str, Any] | None:
    table = get_ticket_table()

    updated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    expression_names = {
        "#updatedAt": "updatedAt",
    }

    expression_values = {
        ":updatedAt": updated_at,
    }

    update_parts = [
        "#updatedAt = :updatedAt",
    ]

    if "status" in updates:
        expression_names["#status"] = "status"
        expression_values[":status"] = updates["status"]
        update_parts.append("#status = :status")

    if "priority" in updates:
        expression_names["#priority"] = "priority"
        expression_values[":priority"] = updates["priority"]
        update_parts.append("#priority = :priority")

    if "category" in updates:
        expression_names["#category"] = "category"
        expression_values[":category"] = updates["category"]
        update_parts.append("#category = :category")

    response = table.update_item(
        Key={
            "ticketId": ticket_id,
        },
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expression_names,
        ExpressionAttributeValues=expression_values,
        ConditionExpression="attribute_exists(ticketId)",
        ReturnValues="ALL_NEW",
    )
    return response.get("Attributes")
def delete_ticket(
    ticket_id: str,
) -> dict[str, Any] | None:
    table = get_ticket_table()

    response = table.delete_item(
        Key={
            "ticketId": ticket_id,
        },
        ConditionExpression="attribute_exists(ticketId)",
        ReturnValues="ALL_OLD",
    )
    return response.get("Attributes")

