# Impulse - Transaction Creation with Real-time Updates Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Frontend
    participant API as API Client
    participant TxnView as TransactionViewSet
    participant DB as Database
    participant Signals as Django Signals
    participant Channels as Channel Layer
    participant Consumer as TransactionConsumer
    participant WS as WebSocket
    participant OtherClients as Other Clients

    User->>Frontend: Fill transaction form<br/>(amount, description, category,<br/>budget, is_impulse, date)
    activate Frontend

    Frontend->>API: POST /api/transactions/<br/>{amount, description, category_id,<br/>budget_id, is_impulse, transaction_date, notes}
    activate API

    API->>TxnView: create(request)
    activate TxnView

    TxnView->>TxnView: Validate amount > 0
    TxnView->>TxnView: Validate category belongs to user
    TxnView->>TxnView: Validate budget belongs to user

    TxnView->>DB: INSERT INTO transaction
    activate DB
    DB-->>TxnView: Transaction created
    deactivate DB

    TxnView->>Signals: post_save signal fired
    activate Signals

    Signals->>DB: Serialize transaction data
    activate DB
    DB-->>Signals: Transaction data
    deactivate DB

    alt Transaction has budget
        Signals->>DB: Calculate budget.total_spent<br/>and budget.remaining
        activate DB
        DB-->>Signals: Budget data
        deactivate DB
    end

    Signals->>Channels: group_send(<br/>'transactions_group_{user_id}',<br/>{action: 'created', transaction, budget_update})
    activate Channels

    Channels->>Consumer: transaction_update()
    activate Consumer

    Consumer->>WS: Send JSON message
    activate WS

    WS->>OtherClients: Broadcast transaction update
    activate OtherClients
    OtherClients->>OtherClients: Update transaction list
    OtherClients->>OtherClients: Update budget display
    OtherClients->>OtherClients: Refresh dashboard metrics
    deactivate OtherClients

    deactivate WS
    deactivate Consumer
    deactivate Channels
    deactivate Signals

    TxnView-->>API: 201 Created<br/>{transaction_data}
    deactivate TxnView

    API-->>Frontend: Transaction created
    deactivate API

    Frontend->>Frontend: Add transaction to local state
    Frontend->>Frontend: Update budget summary
    Frontend-->>User: Transaction saved successfully
    deactivate Frontend

    Note over Frontend,OtherClients: All connected clients of the same user<br/>receive real-time updates via WebSocket
```

## Description

This sequence diagram illustrates the complete flow of creating a transaction with real-time WebSocket updates to all connected clients.

### Key Steps

1. **Form Submission (Steps 1-2)**
   - User fills out transaction form with all details
   - Form submitted to backend API

2. **Validation & Creation (Steps 3-7)**
   - Amount validated (must be > 0)
   - Category ownership validated
   - Budget ownership validated
   - Transaction record created in database

3. **Signal Processing (Steps 8-13)**
   - Django post_save signal automatically triggered
   - Transaction data serialized
   - If budget linked, budget totals recalculated
   - Budget spending and remaining amounts updated

4. **WebSocket Broadcasting (Steps 14-19)**
   - Signal handler sends message to Channel Layer
   - Channel Layer routes to TransactionConsumer
   - Consumer broadcasts to all connected clients
   - Each client in user's group receives update

5. **Client Updates (Steps 20-22)**
   - All connected browser tabs/devices receive update
   - Transaction lists automatically refresh
   - Budget displays update with new totals
   - Dashboard metrics recalculated

6. **Response & UI Update (Steps 23-27)**
   - API returns success response
   - Frontend updates local state
   - Success notification shown to user

### Important Notes

- **Real-time Sync**: All devices/tabs of the same user stay synchronized
- **Signal-Based**: WebSocket broadcasts triggered automatically by Django signals
- **Group Messaging**: Each user has their own WebSocket group (`transactions_group_{user_id}`)
- **Budget Tracking**: When transaction links to budget, all budget metrics update instantly
- **Multi-device**: Changes made on one device appear immediately on all other connected devices
