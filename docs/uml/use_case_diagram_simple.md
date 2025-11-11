## Use Case Diagram

```mermaid
graph TB
    %% Actors
    User([User])

    %% Core Features
    subgraph Core_Features["Core Features"]
        UC1[Manage Account]
        UC2[Manage Budgets]
        UC3[Track Transactions]
        UC4[Set Savings Goals]
        UC5[View Analytics]
    end

    %% User connections
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5

    %% Key relationships
    UC2 -.->|includes| UC3
    UC5 -.->|includes| UC3

    style User fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    style Core_Features fill:#f5f5f5,stroke:#333,stroke-width:2px
```


This use case diagram shows the **5 core features** of the Impulse application:

1. **Manage Account** - Register, login, logout, profile management
2. **Manage Budgets** - Create and edit budgets with category allocations
3. **Track Transactions** - Record, categorize, and mark impulse purchases
4. **Set Savings Goals** - Create goals and track progress
5. **View Analytics** - Dashboard, spending trends, and reports