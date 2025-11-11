# Impulse - Budget Setup Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> Login[User logs in]
    Login --> CheckBudget{Budget exists?}

    CheckBudget -->|Yes| Dashboard[Navigate to Dashboard]
    Dashboard --> End([End])

    CheckBudget -->|No| Setup[Navigate to Budget Setup page]
    Setup --> DisplayForm[Display budget creation form]
    DisplayForm --> EnterDetails[User enters budget details:<br/>- Budget name<br/>- Total amount<br/>- Start date<br/>- End date]

    EnterDetails --> ShowCategories[Display predefined categories:<br/>- Groceries<br/>- Rent/Mortgage<br/>- Utilities<br/>- Transportation<br/>- Entertainment<br/>- Healthcare<br/>- Other]

    ShowCategories --> SelectCategories[User selects categories]

    SelectCategories --> NeedCustom{Need custom<br/>category?}
    NeedCustom -->|Yes| AddCustom[User adds custom category]
    AddCustom --> AddToList[Add to selected categories]
    AddToList --> MoreCustom{More custom<br/>categories?}
    MoreCustom -->|Yes| AddCustom
    MoreCustom -->|No| Allocate

    NeedCustom -->|No| Allocate[User allocates budget<br/>to each category]

    Allocate --> Calculate[Calculate total allocated]
    Calculate --> ValidateTotal{Total allocated <=<br/>Budget amount?}

    ValidateTotal -->|No| ShowError[Show error:<br/>'Total allocation exceeds budget']
    ShowError --> Adjust[Adjust allocations]
    Adjust --> Allocate

    ValidateTotal -->|Yes| Submit[Submit budget creation]

    Submit --> CreateBudget[Create Budget record]
    Submit --> CreateCategories[Create Category records<br/>if custom categories]
    Submit --> CreateAllocations[Create BudgetCategoryAllocation<br/>records for each category]

    CreateBudget --> ValidateCreation
    CreateCategories --> ValidateCreation
    CreateAllocations --> ValidateCreation{All records<br/>created successfully?}

    ValidateCreation -->|Yes| SetActive[Set budget as active]
    SetActive --> UpdateFlag[Update user's hasBudget flag]
    UpdateFlag --> Success[Show success message]
    Success --> Dashboard2[Navigate to Dashboard]
    Dashboard2 --> End

    ValidateCreation -->|No| Rollback[Rollback transaction]
    Rollback --> ErrorMsg[Show error message]
    ErrorMsg --> DisplayForm

    style Start fill:#90EE90
    style End fill:#FFB6C1
    style CheckBudget fill:#FFE4B5
    style NeedCustom fill:#FFE4B5
    style MoreCustom fill:#FFE4B5
    style ValidateTotal fill:#FFE4B5
    style ValidateCreation fill:#FFE4B5
    style ShowError fill:#FFA07A
    style ErrorMsg fill:#FFA07A
```

## Description

This activity diagram shows the complete workflow for setting up a new budget in the Impulse application.

### Key Workflows

#### 1. **Budget Existence Check**
- System checks if user already has a budget
- If yes → Navigate directly to dashboard
- If no → Proceed with budget setup

#### 2. **Budget Details Entry**
- User enters basic budget information:
  - Budget name
  - Total amount available
  - Start and end dates for budget period

#### 3. **Category Selection**
- System displays predefined categories
- User selects which categories to use
- Option to add custom categories
- Loop allows adding multiple custom categories

#### 4. **Budget Allocation**
- User allocates dollar amounts to each selected category
- System calculates total allocated
- Validation ensures total doesn't exceed budget amount
- If exceeds, user must adjust allocations

#### 5. **Database Transaction**
- Creates Budget record
- Creates any new custom Category records
- Creates BudgetCategoryAllocation records
- All operations in single transaction
- If any fails, entire operation rolls back

#### 6. **Completion**
- Budget marked as active
- User's hasBudget flag updated
- Success message shown
- User redirected to dashboard

### Important Notes

- **Transaction Safety**: All database operations occur in a transaction to ensure data consistency
- **Validation**: Multiple validation points prevent invalid data
- **User Experience**: Clear error messages guide users to fix issues
- **Flexibility**: Users can use predefined or custom categories
- **One-time Setup**: New users must complete this before using other features
