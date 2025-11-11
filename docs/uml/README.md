# Impulse - UML Diagrams

This directory contains comprehensive UML diagrams for the Impulse personal finance management application. These diagrams provide different views of the system architecture, behavior, and interactions.

## Overview

The Impulse application is a full-stack personal finance management system built with Django REST Framework (backend) and React (frontend). It helps users track spending, manage budgets, identify impulse purchases, and analyze spending patterns.

**All diagrams are written in Mermaid format and render directly on GitHub!** 🎉

## Diagrams Included

### 1. Class Diagram ([`class_diagram.md`](class_diagram.md))

**Purpose:** Shows the static structure of the system including all models, their attributes, methods, and relationships.

**Key Elements:**
- **Models:** User, Category, Budget, Transaction, BudgetCategoryAllocation, SavingsGoal
- **ViewSets:** AuthViewSet, CategoryViewSet, BudgetViewSet, TransactionViewSet, SavingsGoalViewSet, AnalyticsViewSet, DashboardViewSet
- **WebSocket:** TransactionConsumer
- **Relationships:** One-to-many relationships between User and all entities, foreign key relationships between Budget, Category, and Transaction

**Use Cases:**
- Understanding the database schema
- Identifying model relationships and constraints
- Reviewing API endpoint organization (ViewSets)

[📖 View Class Diagram](class_diagram.md)

---

### 2. Use Case Diagram ([`use_case_diagram.md`](use_case_diagram.md))

**Purpose:** Illustrates the functional requirements and interactions between actors (User, System) and the application.

**Key Elements:**
- **43+ Use Cases** organized into packages:
  - Authentication (Register, Login, Logout, etc.)
  - Budget Management (Create, Edit, View, Allocate)
  - Transaction Management (Record, Edit, Mark Impulse, Filter)
  - Category Management (Create, Edit, Statistics)
  - Savings Goals (Create, Track Progress, View Summary)
  - Analytics & Reports (Dashboard, Trends, Comparisons, Heatmaps)
  - Real-Time Updates (WebSocket broadcasts)

**Use Cases:**
- Defining system requirements
- Understanding user workflows
- Identifying feature scope

[📖 View Use Case Diagram](use_case_diagram.md)

---

### 3. Sequence Diagrams

Four detailed sequence diagrams showing message flows between components:

#### a. User Registration ([`sequence_user_registration.md`](sequence_user_registration.md))

**Flow:** Complete user registration and initial budget setup process
- User registration with validation
- JWT token generation and storage
- Budget existence check
- First-time budget setup with category allocations

[📖 View Diagram](sequence_user_registration.md)

#### b. Transaction Creation ([`sequence_transaction_creation.md`](sequence_transaction_creation.md))

**Flow:** Creating a transaction with real-time WebSocket updates
- Form validation and submission
- Database insertion
- Signal triggering
- WebSocket broadcast to all connected clients
- Real-time UI updates

[📖 View Diagram](sequence_transaction_creation.md)

#### c. Authentication ([`sequence_authentication.md`](sequence_authentication.md))

**Flow:** JWT authentication with automatic token refresh
- Login with credentials
- Token generation (access + refresh)
- Protected endpoint access
- Automatic token refresh on 401
- Token expiration handling

[📖 View Diagram](sequence_authentication.md)

#### d. Analytics Dashboard ([`sequence_analytics_dashboard.md`](sequence_analytics_dashboard.md))

**Flow:** Loading dashboard data with parallel API calls
- Dashboard metrics calculation
- Budget summary aggregation
- Monthly analytics
- Savings goals summary
- Parallel data loading for performance

[📖 View Diagram](sequence_analytics_dashboard.md)

**Use Cases:**
- Understanding system behavior during key operations
- Debugging interaction flows
- Identifying performance bottlenecks

---

### 4. Activity Diagrams (Flowcharts)

Three activity diagrams showing business process flows:

#### a. Budget Setup ([`activity_budget_setup.md`](activity_budget_setup.md))

**Flow:** Step-by-step budget creation process
- Budget details entry
- Category selection (predefined + custom)
- Amount allocation to categories
- Validation and error handling
- Database transaction management

[📖 View Diagram](activity_budget_setup.md)

#### b. Transaction Recording ([`activity_transaction_recording.md`](activity_transaction_recording.md))

**Flow:** Recording a transaction with impulse detection
- Form filling and validation
- Category and budget selection
- Impulse purchase marking
- Abandon/resist keyword detection
- Real-time broadcast to other clients

[📖 View Diagram](activity_transaction_recording.md)

#### c. Impulse Analysis ([`activity_impulse_analysis.md`](activity_impulse_analysis.md))

**Flow:** Calculating and displaying impulse spending metrics
- Dashboard metric calculations:
  - Impulses resisted this month
  - Total saved from abandoned purchases
  - Streak days without impulse
  - Spending by category
- Detailed impulse analysis with visualizations

[📖 View Diagram](activity_impulse_analysis.md)

**Use Cases:**
- Understanding business logic
- Documenting workflows for stakeholders
- Identifying decision points and branches

---

### 5. State Diagrams

Three state diagrams showing object lifecycle and state transitions:

#### a. Budget Lifecycle ([`state_budget_lifecycle.md`](state_budget_lifecycle.md))

**States:** Draft → Active → {Under Budget, At Risk, Over Budget} → Expired/Inactive/Archived
- Budget creation states
- Active monitoring with dynamic status calculation
- Budget health indicators
- Deactivation and archival

[📖 View Diagram](state_budget_lifecycle.md)

#### b. Transaction ([`state_transaction.md`](state_transaction.md))

**States:** Creating → {Planned, Impulse} → Editing/Deleted
- Transaction entry process
- Impulse vs planned classification
- Abandoned purchase detection
- Mark/unmark impulse transitions

[📖 View Diagram](state_transaction.md)

#### c. User Session ([`state_user_session.md`](state_user_session.md))

**States:** Anonymous → {Registering, LoggingIn} → Authenticated → Active Session
- Registration and login flows
- Token-based authentication states
- Budget setup for new users
- Automatic token refresh
- Session expiration handling

[📖 View Diagram](state_user_session.md)

**Use Cases:**
- Understanding object lifecycles
- Documenting state transitions and triggers
- Identifying valid/invalid state changes

---

### 6. Component Diagram ([`component_diagram.md`](component_diagram.md))

**Purpose:** Shows the high-level system architecture with all major components and their interactions.

**Layers:**
1. **Frontend Layer**
   - React SPA (Pages, Components, Context, Hooks)
   - API Client with Axios interceptors
   - React Router
   - Vite build tool

2. **Backend Layer**
   - ASGI Server (Daphne)
   - Django Application (ViewSets, Serializers, Models)
   - Authentication (JWT)
   - WebSocket Layer (Django Channels)
   - Signals for real-time updates

3. **Data Layer**
   - PostgreSQL database
   - Database connection (psycopg2)

4. **Infrastructure Layer**
   - Static file server (WhiteNoise)
   - WSGI server (Gunicorn)
   - Deployment platform (Render.com)

[📖 View Component Diagram](component_diagram.md)

**Use Cases:**
- Understanding system architecture
- Identifying dependencies between components
- Planning deployment strategy

---

## How to View the Diagrams

### ✨ Option 1: GitHub (Easiest!)

**Simply click any diagram link above!** Mermaid diagrams render automatically on GitHub. Just navigate to any `.md` file in this directory.

### 🌐 Option 2: Mermaid Live Editor

1. Visit [Mermaid Live Editor](https://mermaid.live/)
2. Open any `.md` file
3. Copy the Mermaid code block (between ` ```mermaid ` and ` ``` `)
4. Paste into the editor
5. View the rendered diagram

### 💻 Option 3: VS Code Extension

1. Install the **Markdown Preview Mermaid Support** extension
2. Open any `.md` file
3. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) for Markdown preview
4. Diagrams render automatically in preview

**Recommended Extensions:**
- **Markdown Preview Mermaid Support** (ID: `bierner.markdown-mermaid`)
- **Mermaid Markdown Syntax Highlighting** (ID: `bpruitt-goddard.mermaid-markdown-syntax-highlighting`)

### 🔧 Option 4: Other IDEs

**IntelliJ IDEA / PyCharm:**
- Built-in Markdown support with Mermaid rendering
- Just open the `.md` files

**Obsidian:**
- Native Mermaid support
- Open vault in this directory

**Notion, Confluence, etc:**
- Many modern documentation platforms support Mermaid
- Paste the Mermaid code blocks directly

### 📱 Option 5: Browser Extensions

**Chrome/Edge:**
- Install "Mermaid Diagrams" extension
- Renders Mermaid in any web page

---

## Diagram Format: Why Mermaid?

We use **Mermaid** instead of other UML tools because:

✅ **GitHub Native**: Renders automatically in GitHub README files and markdown
✅ **Version Control Friendly**: Plain text, not binary images
✅ **Easy to Edit**: Simple text-based syntax
✅ **No External Tools**: No need to install PlantUML, Graphviz, etc.
✅ **Wide Support**: Works in GitHub, GitLab, VS Code, Notion, Confluence, and more
✅ **Collaboration**: Easy to review and modify in pull requests
✅ **Always Up-to-Date**: Diagrams live with code, not separate image files

---

## Diagram Maintenance

When updating the application:

| Change Type | Update These Diagrams |
|-------------|----------------------|
| Add new models | [`class_diagram.md`](class_diagram.md) |
| Add new features | [`use_case_diagram.md`](use_case_diagram.md) |
| Change workflows | [`sequence_*.md`](.), [`activity_*.md`](.) |
| Modify states | [`state_*.md`](.) |
| Add components | [`component_diagram.md`](component_diagram.md) |
| API changes | [`class_diagram.md`](class_diagram.md), sequence diagrams |
| Authentication changes | [`sequence_authentication.md`](sequence_authentication.md), [`state_user_session.md`](state_user_session.md) |

---

## Technical Details

### Technology Stack Documented

**Backend:**
- Django 5.2.7
- Django REST Framework 3.16.1
- Django Channels 4.3.1 (WebSocket)
- Simple JWT 5.5.1 (Authentication)
- PostgreSQL (Production) / SQLite (Development)
- Daphne 4.2.1 (ASGI Server)
- Gunicorn 23.0.0 (WSGI Server)

**Frontend:**
- React 18.2.0
- React Router DOM 6.20.0
- Axios 1.6.0
- Tailwind CSS 3.4.18
- Vite 7.1.9

**Infrastructure:**
- WhiteNoise 6.11.0 (Static Files)
- Render.com (Deployment)

---

## Key System Features Documented

1. **JWT Authentication** with automatic token refresh (1-hour access, 7-day refresh)
2. **Real-time updates** via WebSocket (Django Channels)
3. **Budget management** with category allocations and spending tracking
4. **Transaction tracking** with impulse purchase detection
5. **Analytics** with multiple time ranges and aggregations
6. **Savings goals** tracking with progress monitoring
7. **Multi-device sync** through WebSocket broadcasts
8. **Impulse streak** tracking to encourage behavior change
9. **Abandoned purchase** detection via keyword heuristics

---

## Quick Reference

### File Structure
```
docs/uml/
├── README.md                              # This file
├── class_diagram.md                       # System structure
├── use_case_diagram.md                    # Functional requirements
├── sequence_user_registration.md          # Registration flow
├── sequence_transaction_creation.md       # Transaction + WebSocket
├── sequence_authentication.md             # JWT auth + refresh
├── sequence_analytics_dashboard.md        # Dashboard data loading
├── activity_budget_setup.md               # Budget creation workflow
├── activity_transaction_recording.md      # Transaction recording
├── activity_impulse_analysis.md           # Impulse analysis
├── state_budget_lifecycle.md              # Budget states
├── state_transaction.md                   # Transaction states
├── state_user_session.md                  # User session states
└── component_diagram.md                   # System architecture
```

### Diagram Types

| UML Type | Mermaid Type | Files |
|----------|--------------|-------|
| Class | `classDiagram` | [`class_diagram.md`](class_diagram.md) |
| Use Case | `graph` | [`use_case_diagram.md`](use_case_diagram.md) |
| Sequence | `sequenceDiagram` | `sequence_*.md` |
| Activity | `flowchart` | `activity_*.md` |
| State | `stateDiagram-v2` | `state_*.md` |
| Component | `graph TB` | [`component_diagram.md`](component_diagram.md) |

---

## Contributing

When contributing to the codebase, please update the relevant UML diagrams to reflect your changes. This keeps the documentation synchronized with the implementation.

### How to Update Diagrams

1. **Find the relevant diagram** using the table above
2. **Open the `.md` file** in your editor
3. **Edit the Mermaid code** within the ` ```mermaid ` code block
4. **Preview your changes** (GitHub, VS Code, or Mermaid Live)
5. **Commit with descriptive message** explaining what changed

### Best Practices

- ✅ Update diagrams in the same PR as code changes
- ✅ Test diagram rendering before committing
- ✅ Keep diagrams concise and focused
- ✅ Use consistent naming with actual code
- ✅ Add notes/comments for complex logic
- ❌ Don't create overly complex diagrams
- ❌ Don't include implementation details in architectural diagrams

---

## Learning Mermaid

New to Mermaid? Here are some resources:

- [Official Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/) (interactive playground)
- [Mermaid Cheat Sheet](https://jojozhuang.github.io/tutorial/mermaid-cheat-sheet/)
- [GitHub Mermaid Guide](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)

---

## Questions or Issues?

If you find any discrepancies between the diagrams and the actual implementation:

1. **Verify the current code** to confirm the discrepancy
2. **Update the relevant diagram(s)** to match reality
3. **Document the changes** in your commit message
4. **Open an issue** if the discrepancy reveals a bug

---

## Export Options

Need diagrams in other formats?

### Export to PNG/SVG

**Method 1: Mermaid Live Editor**
1. Open diagram in [Mermaid Live](https://mermaid.live/)
2. Click "Actions" → "PNG" or "SVG"
3. Download the image

**Method 2: Mermaid CLI**
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i class_diagram.md -o class_diagram.png
```

### Export to PDF

**Method 1: Print from Browser**
1. View diagram on GitHub
2. Open browser print dialog
3. Select "Save as PDF"

**Method 2: Mermaid CLI**
```bash
mmdc -i class_diagram.md -o class_diagram.pdf
```

---

**Last Updated:** 2025-11-11
**Version:** 2.0 (Mermaid Edition)
**Format:** Mermaid Markdown
**Total Diagrams:** 14 files
**Lines of Documentation:** ~3,500+

---

**Enjoy exploring the Impulse architecture!** 🚀💰📊
