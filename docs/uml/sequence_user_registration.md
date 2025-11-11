# Impulse - User Registration & Budget Setup Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Frontend
    participant API as API Client
    participant Auth as AuthViewSet
    participant DjangoAuth as Django Auth
    participant DB as Database
    participant Budget as BudgetViewSet

    User->>Frontend: Enter registration details<br/>(email, username, name, password)
    activate Frontend

    Frontend->>Frontend: Validate password match
    Frontend->>API: POST /api/auth/register/<br/>{email, username, first_name,<br/>last_name, password, password2}
    activate API

    API->>Auth: register(request)
    activate Auth

    Auth->>Auth: Validate unique email/username
    Auth->>Auth: Validate password strength

    Auth->>DjangoAuth: create_user()
    activate DjangoAuth
    DjangoAuth->>DB: INSERT INTO auth_user
    activate DB
    DB-->>DjangoAuth: User created
    deactivate DB
    DjangoAuth-->>Auth: User object
    deactivate DjangoAuth

    Auth->>Auth: Generate JWT tokens<br/>(access + refresh)
    Auth-->>API: {access, refresh, user_data}
    deactivate Auth

    API-->>Frontend: 201 Created<br/>{tokens, user}
    deactivate API

    Frontend->>Frontend: Store tokens in localStorage
    Frontend->>Frontend: Set AuthContext state
    Frontend-->>User: Registration successful
    Frontend->>Frontend: Navigate to /dashboard

    Frontend->>API: GET /api/budgets/check-exists/
    activate API
    API->>Budget: check_exists()
    activate Budget
    Budget->>DB: SELECT COUNT(*) FROM budget<br/>WHERE user_id = ?
    activate DB
    DB-->>Budget: count = 0
    deactivate DB
    Budget-->>API: {hasBudget: false}
    deactivate Budget
    API-->>Frontend: {hasBudget: false}
    deactivate API

    Frontend->>Frontend: Navigate to /budget/setup

    User->>Frontend: Create budget<br/>(name, amount, dates)
    Frontend->>Frontend: Select predefined categories

    User->>Frontend: Allocate amounts to categories
    Frontend->>API: POST /api/budgets/<br/>{name, amount, start_date,<br/>end_date, allocations[]}
    activate API

    API->>Budget: create(request)
    activate Budget

    Budget->>DB: BEGIN TRANSACTION
    activate DB
    Budget->>DB: INSERT INTO budget
    DB-->>Budget: Budget created

    loop for each category allocation
        Budget->>DB: INSERT INTO budget_category_allocation
    end

    Budget->>DB: COMMIT
    DB-->>Budget: Success
    deactivate DB

    Budget-->>API: 201 Created<br/>{budget_data, allocations}
    deactivate Budget

    API-->>Frontend: Budget created
    deactivate API

    Frontend->>Frontend: Update hasBudget flag
    Frontend->>Frontend: Navigate to /dashboard
    Frontend-->>User: Budget setup complete

    deactivate Frontend
```

## Description

This sequence diagram shows the complete flow of user registration and initial budget setup in the Impulse application.

### Key Steps

1. **Registration (Steps 1-11)**
   - User enters registration details
   - Frontend validates password matching
   - Backend validates uniqueness and password strength
   - User record created in database
   - JWT tokens generated and returned

2. **Token Storage (Steps 12-14)**
   - Tokens stored in browser localStorage
   - Authentication context updated
   - User redirected to dashboard

3. **Budget Check (Steps 15-21)**
   - System checks if user has any budgets
   - If no budget exists, redirect to budget setup
   - First-time users must create a budget

4. **Budget Creation (Steps 22-31)**
   - User enters budget details and dates
   - Selects or creates categories
   - Allocates budget amounts to each category
   - Database transaction ensures data integrity
   - Budget and allocations created atomically

### Important Notes

- All database operations for budget creation happen in a transaction
- JWT tokens have different lifetimes: access (1 hour), refresh (7 days)
- New users are automatically redirected to budget setup
- The hasBudget flag determines the user's next destination
