## Class Diagram

```mermaid
classDiagram
    %% Core Models Only
    class User {
        +Integer id
        +String username
        +String email
    }

    class Category {
        +Integer id
        +String name
        +Integer user_id
    }

    class Budget {
        +Integer id
        +String name
        +Decimal amount
        +Date start_date
        +Date end_date
        +Integer user_id
    }

    class Transaction {
        +Integer id
        +Decimal amount
        +String description
        +DateTime transaction_date
        +Boolean is_impulse
        +Integer user_id
        +Integer budget_id
        +Integer category_id
    }

    class BudgetCategoryAllocation {
        +Integer id
        +Decimal allocated_amount
        +Integer budget_id
        +Integer category_id
        +spent_amount Decimal
        +remaining_amount Decimal
    }

    class SavingsGoal {
        +Integer id
        +String name
        +Decimal target_amount
        +Decimal current_amount
        +Date target_date
        +Integer user_id
    }

    %% Relationships
    User "1" --> "0..*" Category
    User "1" --> "0..*" Budget
    User "1" --> "0..*" Transaction
    User "1" --> "0..*" SavingsGoal

    Budget "1" --> "0..*" Transaction
    Category "0..1" --> "0..*" Transaction

    Budget "1" --> "0..*" BudgetCategoryAllocation
    Category "1" --> "0..*" BudgetCategoryAllocation

    note for Transaction "is_impulse flag tracks<br/>impulse purchases"
    note for BudgetCategoryAllocation "Tracks spending per<br/>category within budget"
```

## Core Data Models

This simplified class diagram shows the **6 core models** in the Impulse application:

### 1. User
Django's built-in user model for authentication

### 2. Category
Spending categories (e.g., Food, Transport, Entertainment)
- User-specific categories
- Used for organizing transactions

### 3. Budget
Budget periods with total amounts
- Start and end dates define the budget period
- Users can have multiple budgets (current and past)

### 4. Transaction
Individual financial transactions (expenses)
- Links to optional Budget and Category
- `is_impulse` flag identifies impulse purchases

### 5. BudgetCategoryAllocation
Allocates budget amounts to specific categories
- Each budget can allocate funds to multiple categories
- Computed properties: `spent_amount`, `remaining_amount`
- Enforces unique (budget, category) pairs

### 6. SavingsGoal
Savings goals users want to achieve
- Track progress toward target amounts
- Target dates for motivation

### Key Relationships

- **User → Everything**: All data is user-scoped
- **Budget → Allocations**: One budget has many category allocations
- **Budget → Transactions**: Transactions optionally link to a budget
- **Category → Transactions**: Transactions optionally link to a category
- **Category → Allocations**: Categories receive budget allocations

### Important Notes

- `Transaction.budget_id` and `Transaction.category_id` use `SET_NULL` on delete to preserve transaction history
- `BudgetCategoryAllocation` has a unique constraint on (budget, category)
