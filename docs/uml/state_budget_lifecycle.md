# Impulse - Budget Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft: User initiates\nbudget creation

    state Draft {
        [*] --> EnteringDetails
        EnteringDetails: Budget name, amount,\nstart/end dates entered

        EnteringDetails --> SelectingCategories: Details validated
        SelectingCategories: User selects/creates\ncategories

        SelectingCategories --> AllocatingAmounts: Categories selected
        AllocatingAmounts: User allocates budget\namounts to categories

        AllocatingAmounts --> AllocatingAmounts: Adjust allocations
        AllocatingAmounts --> EnteringDetails: Edit budget details
    }

    Draft --> Active: Budget saved\nand activated
    Draft --> [*]: User cancels

    state Active {
        [*] --> Monitoring
        Monitoring: Tracking expenses\nagainst budget\nCalculating total_spent\nand remaining

        Monitoring --> UnderBudget: remaining > 20% of amount
        Monitoring --> AtRisk: remaining <= 20% AND > 0
        Monitoring --> OverBudget: remaining <= 0

        UnderBudget: Safe spending level\nGood budget health
        AtRisk: Warning level\nApproaching limit
        OverBudget: Exceeded budget\nNeed attention

        UnderBudget --> AtRisk: More spending
        UnderBudget --> Monitoring: Transaction added/removed

        AtRisk --> OverBudget: More spending
        AtRisk --> UnderBudget: Transaction removed
        AtRisk --> Monitoring: Transaction modified

        OverBudget --> AtRisk: Transaction removed
        OverBudget --> Monitoring: Transaction modified

        Monitoring --> EditingAllocations: User modifies\ncategory allocations

        EditingAllocations: Adjusting category\nallocations
        EditingAllocations --> Monitoring: Allocations saved
    }

    Active --> Expired: end_date reached
    Active --> Inactive: User deactivates\n(is_active = false)
    Active --> Editing: User edits\nbudget details

    state Editing {
        [*] --> ModifyingDetails
        ModifyingDetails: Changing name, amount,\ndates, or allocations
    }

    Editing --> Active: Changes saved
    Editing --> Active: User cancels

    Inactive --> Active: User reactivates\n(is_active = true)
    Inactive --> Archived: User archives budget
    Inactive --> [*]: User deletes budget

    Expired --> Inactive: Auto-deactivate
    Expired --> Archived: User archives
    Expired --> [*]: User deletes

    Archived --> [*]: User deletes

    note right of Draft
        Budget is being created
        but not yet saved or active
    end note

    note right of Active
        Budget is actively tracking
        expenses and monitoring
        spending against allocations
    end note

    note right of Expired
        Budget period has ended
        (current_date > end_date)
    end note

    note right of Monitoring
        Budget state is calculated dynamically:
        - total_spent = SUM(transactions.amount)
        - remaining = amount - total_spent
        - Status determined by remaining amount
    end note
```

## Description

This state diagram illustrates the complete lifecycle of a budget in the Impulse application, from creation through archival.

### Budget States

#### **Draft**
- Initial state during budget creation
- Sub-states:
  - **EnteringDetails**: User inputs basic budget info
  - **SelectingCategories**: Choosing expense categories
  - **AllocatingAmounts**: Distributing budget across categories
- Can loop between sub-states for refinement
- Exits to Active (saved) or terminates (cancelled)

#### **Active**
Main operational state with dynamic monitoring

**Sub-states:**
- **Monitoring**: Default active state, tracking all expenses
- **UnderBudget**: remaining > 20% of budget amount
  - Green/safe zone
  - Normal spending levels
- **AtRisk**: remaining ≤ 20% but > 0
  - Yellow/warning zone
  - Approaching budget limit
- **OverBudget**: remaining ≤ 0
  - Red/danger zone
  - Exceeded budget amount
- **EditingAllocations**: Modifying category allocations

**Dynamic Calculations:**
```python
total_spent = sum(transaction.amount for all linked transactions)
remaining = budget.amount - total_spent
```

**State Transitions:**
- Transactions automatically trigger state recalculation
- Adding/removing/modifying transactions moves between UnderBudget/AtRisk/OverBudget
- User can edit allocations without leaving Active state

#### **Editing**
- User modifying budget details (name, amount, dates)
- Returns to Active when saved or cancelled

#### **Inactive**
- Budget deactivated by user (is_active = false)
- Can be reactivated
- Can be archived or deleted
- Expired budgets auto-transition here

#### **Expired**
- Temporary state when end_date reached
- System marks budget as expired
- User decides to keep inactive, archive, or delete

#### **Archived**
- Budget preserved for historical reference
- Cannot be reactivated
- Only action: delete

### State Transitions

| From | To | Trigger |
|------|-----|---------|
| Draft | Active | User saves budget |
| Draft | [*] | User cancels creation |
| Active | Expired | System: end_date reached |
| Active | Inactive | User deactivates |
| Active | Editing | User clicks edit |
| Editing | Active | User saves changes |
| Inactive | Active | User reactivates |
| Inactive | Archived | User archives |
| Expired | Inactive | Auto-deactivate |
| Archived | [*] | User deletes |

### Important Notes

- **Dynamic Health**: Budget health (UnderBudget/AtRisk/OverBudget) calculated in real-time
- **Transaction Impact**: Every transaction immediately updates budget state
- **Reversible Actions**: Most state changes are reversible (except delete)
- **Date-Based Expiry**: System automatically expires budgets past end_date
- **Archival**: Preserves historical data while preventing accidental reactivation
- **is_active Flag**: Database boolean determines Active vs Inactive state
