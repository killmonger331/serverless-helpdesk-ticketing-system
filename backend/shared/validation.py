# Validation layer, entire job is to ensure the incoming ticket data is valid and standardize before your lambda writes anything to DynamoDB

import re
from typing import Any

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class ValidationError(ValueError):
    """Raised when incoming ticket data is invalid."""

def validate_create_ticket(data: Any) -> dict:
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")

    title = data.get("title")
    description = data.get("description")
    priority = data.get("priority")
    requester_email = data.get("requesterEmail")
    
    if not isinstance(title, str) or not title.strip():
        raise ValidationError("Title is required.")
    
    title = title.strip()

    if not 5 <= len(title) <= 100:
        raise ValidationError("Title must be between 5 and 100 characters.")

    if not isinstance(description, str) or not description.strip():
        raise ValidationError("Description is required.")

    description = description.strip()

    if not 10 <= len(description) <= 2000:
        raise ValidationError(
            "Description must be between 10 and 2000 characters."
        )
        
    if priority not in {1, 2, 3, 4}:
        raise ValidationError("Priority must be an integer from 1 through 4.")

    if (
        not isinstance(requester_email, str)
        or not EMAIL_PATTERN.match(requester_email.strip())
    ):
        raise ValidationError("A valid requester email is required.")

    return {
        "title": title,
        "description": description,
        "priority": priority,
        "requesterEmail": requester_email.strip().lower(),
    }

ALLOWED_STATUSES = {
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
}

ALLOWED_CATEGORIES = {
    "NETWORK",
    "HARDWARE",
    "SOFTWARE",
    "ACCOUNT_ACCESS",
    "EMAIL",
    "OTHER",
}

def validate_update_ticket(data: Any) -> dict:
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")

    if not data:
        raise ValidationError(
            "At least one field must be provided for update."
        )

    allowed_fields = {"status", "priority", "category"}

    unexpected_fields = set(data.keys()) - allowed_fields

    if unexpected_fields:
        raise ValidationError(
            "Only status, priority, and category can be updated."
        )

    validated_data = {}

    if "status" in data:
        status = data["status"]

        if not isinstance(status, str):
            raise ValidationError("Status must be a string.")

        status = status.strip().upper()

        if status not in ALLOWED_STATUSES:
            raise ValidationError(
                "Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED."
            )

        validated_data["status"] = status

    if "priority" in data:
        priority = data["priority"]

        if priority not in {1, 2, 3, 4}:
            raise ValidationError(
                "Priority must be an integer from 1 through 4."
            )
        validated_data["priority"] = priority
        
    if "category" in data:
        category = data["category"]

        if not isinstance(category, str):
            raise ValidationError("Category must be a string.")

        category = category.strip().upper()
        if category not in ALLOWED_CATEGORIES:
            raise ValidationError(
                "Category must be NETWORK, HARDWARE, SOFTWARE, ACCOUNT_ACCESS, EMAIL, or OTHER."
            )
        validated_data["category"] = category
        

    return validated_data