# Impulse

A personal finance app that helps users track spending, resist impulse purchases, and stay within budget through category-based allocations and real-time analytics.

## Features

- **Budget Management**: Create budgets with category-specific allocations
- **Transaction Tracking**: Log expenses and flag impulse purchases
- **Analytics & Insights**: Visualize spending patterns, category breakdowns, and impulse buying trends
- **Streak Tracking**: Monitor days without impulse purchases
- **User Authentication**: Secure JWT-based authentication


## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- PostgreSQL (or use SQLite for development)
- Git

---

## Quick Start with Scripts

Using the `install.sh` and `launchdev.sh` scripts:

```bash
# Install dependencies and apply migrations
./install.sh

# Launch Django backend in background and React frontend in foreground
./launchdev.sh
```

---

# Full Setup

## Backend Setup (Django)

### Step 1:  Create Virtual Environment and Navigate to Backend

```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

cd backend
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 4: Set Up Environment Variables (Optional)

Create a `.env` file in the `backend` directory (optional for local development):

```bash
# Database (optional, defaults to PostgreSQL on localhost)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backend

# Security (change in production!)
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### Step 5: Create a Superuser (Optional)

```bash
python manage.py createsuperuser
```

This allows you to access the Django admin panel at `http://localhost:8000/admin`

### Step 6: Run Development Server

```bash
python manage.py runserver
```

Django will run on `http://localhost:8000`

---

## Frontend Setup (React)

### Step 1: Navigate to Frontend and Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Set Up Environment Variables (Optional)

Create a `.env` file in the `frontend` directory to override the API URL:

```bash
VITE_API_URL=http://localhost:8000/api
```

### Step 3: Run Development Server

```bash
npm run dev
```

React will run on `http://localhost:5173` (or next available port)


---

## Using the Application

### 1. Access the Frontend

Open your browser to `http://localhost:5173`

### 2. Create an Account

1. Click "Sign up" link
2. Enter registration details:
   - Username: `testuser`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `testpass123`
   - Confirm Password: `testpass123`
3. Click "Sign Up"
4. You'll be redirected to the Budget Setup page (first-time users)

### 3. Set Up Your First Budget

1. Enter budget details:
   - Budget Name: "Monthly Budget"
   - Total Amount: 2000
   - Start Date: (current month start)
   - End Date: (current month end)
2. Add categories (e.g., Food, Transport, Entertainment)
3. Allocate amounts to each category
4. Click "Create Budget"

### 4. Track Transactions

1. Navigate to the Transactions page
2. Log a new transaction with:
   - Description
   - Amount
   - Category
   - Date/Time
   - Mark as impulse purchase (optional)
3. View transaction history and filter by category, date, or impulse flag

### 5. View Analytics

Visit the Dashboard to see:
- Total spending vs. budget
- Spending by category
- Impulse purchase analysis
- Savings goals progress
- Spending trends over time

---

## Pages

- **SignUp**: New user registration with email, password, and profile details
- **LogIn**: User authentication with username and password
- **Dashboard**: Main overview showing budget summary, disposable income remaining, impulse purchase streak, spending by category, and recent transactions
- **BudgetSetup**: First-time budget creation wizard for new users
- **BudgetEdit**: Modify existing budgets and adjust category allocations
- **Transactions**: View, filter, and manage all transactions; log new expenses with impulse purchase flagging
- **Analytics**: Visualize spending trends, category breakdowns, and impulse buying patterns with charts

---

## API

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

### Endpoints

The API provides the following resource endpoints:

- **`/api/auth/`** - Authentication (register, login, logout, refresh, me)
- **`/api/categories/`** - Category management (CRUD + bulk create + statistics)
- **`/api/budgets/`** - Budget management (CRUD + allocations + summary)
- **`/api/transactions/`** - Transaction tracking (CRUD + filtering + impulse marking)
- **`/api/savings-goals/`** - Savings goal management (CRUD + progress tracking)
- **`/api/analytics/`** - Analytics and insights (spending trends, category breakdowns)
- **`/api/dashboard/`** - Dashboard metrics (aggregated stats)

#### Authentication

```bash
# Register
POST /api/auth/register/
Body: { username, email, first_name, last_name, password, password_confirm }

# Login
POST /api/auth/login/
Body: { username, password }

# Refresh Token
POST /api/auth/refresh/
Body: { refresh }

# Get Current User
GET /api/auth/me/
```

#### Categories

```bash
# List all categories
GET /api/categories/

# Create category
POST /api/categories/
Body: { name }

# Bulk create categories
POST /api/categories/bulk_create/
Body: { categories: [{ name }, { name }, ...] }

# Get category statistics
GET /api/categories/statistics/
```

#### Budgets

```bash
# List all budgets
GET /api/budgets/

# Create budget
POST /api/budgets/
Body: { name, amount, start_date, end_date, is_active }

# Get active budgets
GET /api/budgets/active/

# Get budget summary
GET /api/budgets/summary/

# Get budget allocations
GET /api/budgets/{id}/allocations/

# Update budget allocations
POST /api/budgets/{id}/update_allocations/
Body: { allocations: [{ category, allocated_amount }, ...] }
```

#### Transactions

```bash
# List transactions (with optional filters)
GET /api/transactions/?category={id}&budget={id}&is_impulse={true/false}&start_date={date}&end_date={date}

# Create transaction
POST /api/transactions/
Body: { description, amount, category, budget, transaction_date, is_impulse, notes }

# Mark as impulse purchase
POST /api/transactions/{id}/mark_impulse/

# Get recent transactions
GET /api/transactions/recent/

# Get monthly total
GET /api/transactions/monthly_total/
```

#### Analytics

```bash
# Spending by category (for charts)
GET /api/analytics/spending-by-category/

# Spending trend (30 days)
GET /api/analytics/spending-trend/

# Impulse vs planned analysis
GET /api/analytics/impulse-analysis/

# Monthly summary
GET /api/analytics/monthly-summary/
```

### Testing API Endpoints

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' | jq -r '.tokens.access')

# Use token for authenticated requests
curl -X GET http://localhost:8000/api/categories/ \
  -H "Authorization: Bearer $TOKEN"
```

---