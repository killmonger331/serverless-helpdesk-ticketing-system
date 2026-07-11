#Ticket Model

##Client-provided fields

- title: string, required, 5-100 characters
- description: string, requried, 10-2000 characters
- priority: integer, required, 1-4
-requesterEmail: string, required

##Server-generated fields

- ticketID: string
- status: string, initially OPEN
- createdAt: ISO 8601 UTC timestamp
- updatedAt: ISO 8601 UTC timestamp

## DynamoDB primary key

- Partition key: ticketId

##API contract

POST /tickets

Success: 201 Created

{
  "message": "Ticket created successfully.",
  "ticketId": "TKT-A3F91C2B",
  "status": "OPEN"
}
