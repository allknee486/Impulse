## Recording a Transaction with Real-time Updates

```mermaid
sequenceDiagram
    actor User
    participant Browser as React App
    participant API as Django REST API
    participant DB as PostgreSQL
    participant WS as WebSocket Service
    participant Other as Other Clients

    User->>Browser: Enter transaction details
    Browser->>Browser: Get JWT token from localStorage

    Browser->>+API: POST /api/transactions/<br/>(with JWT in header)
    API->>API: Validate JWT token
    API->>API: Validate transaction data

    API->>+DB: Save transaction
    DB-->>-API: Transaction saved

    Note over API,WS: Django Signal Triggered
    API->>WS: Broadcast transaction update

    API-->>-Browser: 201 Created<br/>(transaction data)
    Browser->>Browser: Update UI with new transaction

    WS->>Other: Push update via WebSocket
    Other->>Other: Update UI automatically

    Browser->>User: Show success message
    Other->>User: Show real-time update
```

## Description

This sequence diagram illustrates the **interaction flow** when a user records a transaction, showing:

### Components Involved
1. **User** - The person using the application
2. **React App** - Frontend single-page application
3. **Django REST API** - Backend server handling requests
4. **PostgreSQL** - Database storing transaction data
5. **WebSocket Service** - Real-time update broadcaster
6. **Other Clients** - Other devices/tabs connected to the same user account

### Interaction Flow

#### 1. User Input
User enters transaction details (amount, description, category, etc.)

#### 2. Authentication
- React app retrieves JWT token from localStorage
- Token is added to the HTTP request header

#### 3. API Processing
- Django validates the JWT token (authenticates user)
- Validates transaction data (serializer validation)
- Saves transaction to database

#### 4. Real-time Broadcast
- Django signal detects transaction save
- WebSocket service broadcasts update to all connected clients
- Other browser tabs/devices receive instant updates

#### 5. Response
- API returns 201 Created with transaction data
- Original client updates UI
- Other clients automatically update their UI via WebSocket
