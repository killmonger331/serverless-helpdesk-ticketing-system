# Serverless Help Desk Ticketing System

A full-stack serverless help desk application built on AWS that allows customers to submit and track support tickets while providing authenticated administrators with tools to view, search, filter, and update tickets.

The project was designed as a practical demonstration of serverless application architecture, event-driven AWS services, authentication and authorization, Infrastructure as Code, secure frontend delivery, and automated CI/CD.

## Live Application

The application is deployed through Amazon CloudFront over HTTPS.

**Live site:**
`https://d3dn4ad0a3w7w4.cloudfront.net`

The frontend is stored in a private Amazon S3 bucket and is accessible publicly only through CloudFront.

---

# Architecture

The application uses a serverless AWS architecture:

```text
                         ┌───────────────────────┐
                         │       Customer        │
                         └───────────┬───────────┘
                                     │
                                   HTTPS
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      CloudFront       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   Private S3 Bucket   │
                         │       Frontend        │
                         └───────────┬───────────┘
                                     │
                                     │ REST API
                                     ▼
                         ┌───────────────────────┐
                         │     API Gateway       │
                         └───────────┬───────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
           Create Ticket        Get/List Ticket     Update Ticket
              Lambda               Lambdas             Lambda
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   DynamoDB   │
                              └──────────────┘

Create / Update Ticket
        │
        ▼
       SNS
        │
        ▼
Notification Lambda
        │
        ▼
       SES
        │
        ▼
 Customer Email


Administrator
     │
     ▼
Amazon Cognito
     │
     ▼
API Gateway Authorizer
     │
     ▼
Protected Administrator APIs
```

---

# Core Features

## Customer Ticket Submission

Customers can submit support tickets through the public web interface.

The application:

* Validates incoming ticket data
* Generates unique ticket IDs
* Assigns new tickets an `OPEN` status
* Stores tickets in Amazon DynamoDB
* Returns the generated ticket number to the customer
* Sends a confirmation email containing the ticket ID and initial status

The ticket creation flow is:

```text
Customer
   ↓
CloudFront / S3
   ↓
POST /tickets
   ↓
API Gateway
   ↓
Create Ticket Lambda
   ↓
DynamoDB
```

---

## Administrator Dashboard

The application provides a separate administrator interface for managing submitted tickets.

Administrators can:

* View the complete ticket queue
* Search for tickets
* Filter tickets by status
* Filter tickets by priority
* View individual ticket details
* Update ticket status
* Update ticket priority
* Refresh the ticket queue
* View ticket creation and update timestamps

Administrator APIs are protected using Amazon Cognito authentication.

---

## Individual Ticket Retrieval

Administrators can select tickets from the queue and retrieve the complete ticket record through:

```text
GET /tickets/{ticketId}
```

The backend handles nonexistent ticket IDs and returns an appropriate `404` response when a ticket cannot be found.

---

## Ticket Updates

Authorized administrators can modify supported ticket fields through:

```text
PATCH /tickets/{ticketId}
```

The application performs server-side validation and protects immutable fields such as:

* `ticketId`
* `createdAt`

The `updatedAt` timestamp is automatically updated whenever a ticket is modified.

---

## Customer Ticket Lookup

Customers can check the status of an existing ticket without receiving access to the administrator interface.

The lookup process requires:

* Ticket ID
* Requester email address

The backend verifies that the supplied email belongs to the requested ticket before returning information.

Only customer-safe ticket information is returned, preventing exposure of administrative data.

---

# Event-Driven Email Notifications

Ticket notifications use an asynchronous event-driven architecture:

```text
Create / Update Lambda
        ↓
   Amazon SNS
        ↓
Notification Lambda
        ↓
   Amazon SES
        ↓
Requester Email
```

Customers receive email notifications when:

* A ticket is successfully created
* The status of an existing ticket changes

Status-change notifications include both the previous and new ticket status.

Notification failures are logged without causing the underlying ticket operation to fail.

---

# Authentication and Security

Administrator authentication is implemented using Amazon Cognito.

The application uses:

* Cognito User Pool
* Cognito App Client
* API Gateway Cognito Authorizer
* Protected administrator API routes
* Public customer API routes
* Token-based administrator requests
* Session expiration handling
* Administrator logout

Protected routes include:

```text
GET   /tickets
GET   /tickets/{ticketId}
PATCH /tickets/{ticketId}
```

Public customer operations include:

```text
POST /tickets
POST /tickets/lookup
```

Additional security controls include:

* Private frontend S3 bucket
* S3 Block Public Access
* CloudFront Origin Access Control
* HTTPS through CloudFront
* Restricted production CORS origin
* IAM-based Lambda permissions
* Customer ownership verification during ticket lookup

---

# Frontend Deployment

The frontend is deployed using Amazon S3 and Amazon CloudFront.

```text
Internet
   ↓
CloudFront
   ↓
Origin Access Control
   ↓
Private S3 Bucket
```

The S3 bucket is not publicly accessible.

CloudFront provides:

* Public application delivery
* HTTPS
* Content caching
* Default root object handling
* Controlled access to the private S3 origin

Production API Gateway CORS configuration is restricted to the deployed CloudFront frontend origin.

---

# Infrastructure as Code

AWS infrastructure is defined using AWS SAM and CloudFormation in:

```text
template.yaml
```

The template provisions and configures infrastructure including:

* Amazon API Gateway
* AWS Lambda
* Amazon DynamoDB
* Amazon SNS
* Amazon Cognito
* Amazon S3
* Amazon CloudFront
* IAM permissions
* API authorization
* CORS configuration

This allows the application's AWS infrastructure to be version controlled and deployed consistently.

---

# CI/CD

The project uses GitHub Actions for continuous integration and continuous deployment.

## Continuous Integration

Pushes and pull requests automatically run:

```text
GitHub Push / Pull Request
        ↓
Set up Python
        ↓
Run pytest Unit Tests
        ↓
sam validate --lint
        ↓
sam build
```

Deployment is blocked when CI checks fail.

Unit tests currently cover core Lambda behaviors including:

* Ticket creation
* Ticket retrieval
* Ticket listing
* Ticket update request validation

## Continuous Deployment

Successful pushes to the `main` branch trigger the production deployment pipeline:

```text
Push to main
      ↓
CI Passes
      ↓
GitHub Actions
      ↓
AWS OIDC Authentication
      ↓
SAM Build
      ↓
CloudFormation Deployment
      ↓
Frontend S3 Sync
      ↓
CloudFront Cache Invalidation
      ↓
Production
```

GitHub Actions does not store long-lived AWS access keys.

Instead, GitHub authenticates to AWS using OpenID Connect (OIDC) and assumes an IAM deployment role using temporary AWS credentials.

CloudFormation uses a separate execution role to modify application infrastructure.

This separates CI/CD authentication from infrastructure execution and eliminates the need to store permanent AWS access keys in GitHub.

---

# API Routes

| Method  | Route                 | Authentication | Purpose                         |
| ------- | --------------------- | -------------- | ------------------------------- |
| `POST`  | `/tickets`            | Public         | Create a support ticket         |
| `POST`  | `/tickets/lookup`     | Public         | Customer ticket-status lookup   |
| `GET`   | `/tickets`            | Cognito        | List tickets for administrators |
| `GET`   | `/tickets/{ticketId}` | Cognito        | Retrieve an individual ticket   |
| `PATCH` | `/tickets/{ticketId}` | Cognito        | Update an existing ticket       |

---

# Technology Stack

## AWS

* AWS Lambda
* Amazon API Gateway
* Amazon DynamoDB
* Amazon Cognito
* Amazon SNS
* Amazon SES
* Amazon S3
* Amazon CloudFront
* AWS IAM
* AWS CloudFormation
* AWS SAM

## Application

* Python
* JavaScript
* HTML
* CSS

## DevOps

* Git
* GitHub
* GitHub Actions
* AWS SAM CLI
* pytest
* GitHub Actions OIDC federation with AWS

---

# Project Structure

```text
serverless-help-desk/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── create_ticket/
│   ├── customer_lookup/
│   ├── get_ticket/
│   ├── list_tickets/
│   ├── notification/
│   ├── update_ticket/
│   └── shared/
│
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── ticket-status.html
│   ├── main.js
│   ├── admin.js
│   ├── api.js
│   ├── config.js
│   └── css/
│
├── tests/
│   ├── events/
│   ├── integration/
│   └── unit/
│
├── template.yaml
├── samconfig.toml
└── README.md
```

---

# Testing

Run the unit tests locally with:

```bash
pytest tests/unit -v
```

Validate the SAM template:

```bash
sam validate --lint
```

Build the serverless application:

```bash
sam build
```

These checks are also performed automatically by GitHub Actions.

---

# Deployment

Production deployment is normally performed automatically through GitHub Actions after a successful push to `main`.

The pipeline:

1. Runs unit tests
2. Validates the SAM template
3. Builds the application
4. Authenticates to AWS through OIDC
5. Deploys the SAM/CloudFormation stack
6. Synchronizes frontend files with S3
7. Invalidates the CloudFront cache

This allows application and infrastructure changes to move from source control to the deployed environment without requiring a manual deployment from a developer workstation.

---

# Design Decisions

## Serverless Architecture

AWS Lambda, API Gateway, and DynamoDB were selected to avoid managing persistent application servers while allowing the application to scale based on demand.

## Separate Lambda Functions

Ticket creation, retrieval, listing, updating, customer lookup, and notifications use separate Lambda handlers.

This keeps responsibilities isolated and allows individual application operations to be modified independently.

## DynamoDB

DynamoDB provides serverless ticket persistence without requiring database server administration.

The ticket ID serves as the primary key.

## SNS Between Ticket Operations and Email

Ticket operations publish notification events to Amazon SNS rather than sending email directly.

This decouples ticket processing from email delivery. A notification failure therefore does not need to cause a successful ticket operation to fail.

## Cognito for Administrator Access

Administrative functionality requires authentication while customer ticket creation remains publicly accessible.

Amazon Cognito and an API Gateway authorizer provide this separation without implementing a custom authentication system.

## Private S3 Origin

The frontend S3 bucket is intentionally private.

CloudFront accesses the bucket through Origin Access Control, providing a public HTTPS entry point without exposing the S3 origin directly.

## OIDC for CI/CD

GitHub Actions uses OIDC federation rather than permanent AWS access keys.

This allows GitHub workflows to obtain temporary AWS credentials when authorized deployments occur.

---

# Project Status

**Core application: Complete**

**Production deployment: Complete**

**CI/CD pipeline: Complete**

The application currently supports the complete workflow from customer ticket submission through authenticated administrator management, customer status lookup, asynchronous email notification, and automated production deployment.
