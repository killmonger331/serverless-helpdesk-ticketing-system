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