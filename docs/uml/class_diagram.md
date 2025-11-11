# Impulse - Class Diagram

```mermaid
classDiagram
    %% Django Auth
    class User {
        +Integer id
        +String username
        +String email
        +String password
        +String first_name
        +String last_name
        +DateTime date_joined
        +DateTime last_login
        +authenticate()
        +set_password()
        +check_password()
    }

    %% Core Models
    class Category {
        +Integer id
        +String name
        +DateTime created_at
        +Integer user_id
        +__str__() String
    }

    class Budget {
        +Integer id
        +String name
        +Decimal amount
        +Date start_date
        +Date end_date
        +Boolean is_active
        +DateTime created_at
        +Integer user_id
        +total_spent Decimal
        +remaining Decimal
        +__str__() String
    }

    class Transaction {
        +Integer id
        +Decimal amount
        +String description
        +Text notes
        +DateTime transaction_date
        +Boolean is_impulse
        +DateTime created_at
        +Integer user_id
        +Integer budget_id
        +Integer category_id
        +__str__() String
    }

    class BudgetCategoryAllocation {
        +Integer id
        +Decimal allocated_amount
        +DateTime created_at
        +DateTime updated_at
        +Integer budget_id
        +Integer category_id
        +spent_amount Decimal
        +remaining_amount Decimal
        +__str__() String
    }

    class SavingsGoal {
        +Integer id
        +String name
        +Decimal target_amount
        +Decimal current_amount
        +Date target_date
        +Boolean is_completed
        +DateTime created_at
        +Integer user_id
        +percentage_complete Float
        +remaining_amount() Decimal
        +__str__() String
    }

    %% ViewSets (Controllers)
    class AuthViewSet {
        +register()
        +login()
        +logout()
        +refresh()
        +me()
    }

    class CategoryViewSet {
        +list()
        +create()
        +retrieve()
        +update()
        +destroy()
        +bulk_create()
        +statistics()
    }

    class BudgetViewSet {
        +list()
        +create()
        +retrieve()
        +update()
        +destroy()
        +active()
        +check_exists()
        +summary()
        +transactions()
        +allocations()
        +update_allocations()
    }

    class TransactionViewSet {
        +list()
        +create()
        +retrieve()
        +update()
        +destroy()
        +mark_impulse()
        +unmark_impulse()
        +recent()
        +impulse()
        +monthly_total()
    }

    class SavingsGoalViewSet {
        +list()
        +create()
        +retrieve()
        +update()
        +destroy()
        +add_progress()
        +active()
        +summary()
    }

    class AnalyticsViewSet {
        +spending_by_category()
        +spending_trend()
        +impulse_analysis()
        +monthly_summary()
        +weekly_spending()
        +monthly_comparison()
        +yearly_breakdown()
        +category_trends()
        +budget_vs_actual()
        +spending_heatmap()
        +time_range()
    }

    class DashboardViewSet {
        +get_dashboard()
    }

    class TransactionConsumer {
        +connect()
        +disconnect()
        +transaction_update()
    }

    %% Relationships
    User "1" --> "0..*" Category : owns
    User "1" --> "0..*" Budget : manages
    User "1" --> "0..*" Transaction : creates
    User "1" --> "0..*" SavingsGoal : tracks

    Budget "1" --> "0..*" Transaction : contains
    Category "0..1" --> "0..*" Transaction : categorizes

    Budget "1" --> "0..*" BudgetCategoryAllocation : allocates
    Category "1" --> "0..*" BudgetCategoryAllocation : receives

    %% ViewSet to Model relationships
    AuthViewSet ..> User : authenticates
    CategoryViewSet ..> Category : manages
    BudgetViewSet ..> Budget : manages
    BudgetViewSet ..> BudgetCategoryAllocation : manages
    TransactionViewSet ..> Transaction : manages
    SavingsGoalViewSet ..> SavingsGoal : manages
    AnalyticsViewSet ..> Transaction : analyzes
    AnalyticsViewSet ..> Budget : analyzes
    AnalyticsViewSet ..> Category : analyzes
    DashboardViewSet ..> Transaction : aggregates
    DashboardViewSet ..> Budget : aggregates
    TransactionConsumer ..> Transaction : broadcasts

    note for Transaction "is_impulse flag identifies impulsive purchases"
    note for BudgetCategoryAllocation "Unique constraint: (budget, category)"
    note for AnalyticsViewSet "Provides comprehensive analytics endpoints with multiple time ranges"
```

## Description

This class diagram shows the complete static structure of the Impulse application including:

- **Core Models**: All database entities with their attributes and methods
- **ViewSets**: API controllers that manage the models
- **Relationships**: One-to-many and foreign key relationships between entities
- **WebSocket Consumer**: Real-time update handler

### Key Relationships

- Users own all their financial data (Categories, Budgets, Transactions, SavingsGoals)
- Transactions can optionally link to a Budget and Category
- Budgets have multiple category allocations that track spending per category
- The is_impulse boolean flag on Transaction enables impulse purchase tracking
