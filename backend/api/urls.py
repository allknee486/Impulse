from django.urls import path, include
from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .views import AuthViewSet, DashboardViewSet, AnalyticsViewSet
=======
from .views import (
    AuthViewSet,
    DashboardViewSet,
    CategoryViewSet,
    BudgetViewSet,
    TransactionViewSet,
    SavingsGoalViewSet,
    AnalyticsViewSet
)
>>>>>>> origin/main

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
<<<<<<< HEAD
=======
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'savings-goals', SavingsGoalViewSet, basename='savingsgoal')
>>>>>>> origin/main
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]

# This creates the following endpoints:
#
# Authentication endpoints:
# POST   /api/auth/register/  - Register new user
# POST   /api/auth/login/     - Login user
# POST   /api/auth/logout/    - Logout user
# POST   /api/auth/refresh/   - Refresh access token
# GET    /api/auth/me/        - Get current user info
#
# Dashboard endpoints:
# GET    /api/dashboard/      - Get dashboard metrics
#
# Category endpoints:
# GET    /api/categories/           - List all categories
# POST   /api/categories/           - Create new category
# GET    /api/categories/{id}/      - Get specific category
# PUT    /api/categories/{id}/      - Update category
# PATCH  /api/categories/{id}/      - Partial update category
# DELETE /api/categories/{id}/      - Delete category
# GET    /api/categories/statistics/ - Get category statistics
#
# Budget endpoints:
# GET    /api/budgets/              - List all budgets
# POST   /api/budgets/              - Create new budget
# GET    /api/budgets/{id}/         - Get specific budget
# PUT    /api/budgets/{id}/         - Update budget
# PATCH  /api/budgets/{id}/         - Partial update budget
# DELETE /api/budgets/{id}/         - Delete budget
# GET    /api/budgets/active/       - Get active budgets
# GET    /api/budgets/summary/      - Get budget summary
# GET    /api/budgets/{id}/transactions/ - Get budget transactions
#
# Transaction endpoints:
# GET    /api/transactions/                    - List all transactions (with filters)
# POST   /api/transactions/                    - Create new transaction
# GET    /api/transactions/{id}/               - Get specific transaction
# PUT    /api/transactions/{id}/               - Update transaction
# PATCH  /api/transactions/{id}/               - Partial update transaction
# DELETE /api/transactions/{id}/               - Delete transaction
# POST   /api/transactions/{id}/mark_impulse/  - Mark as impulse
# POST   /api/transactions/{id}/unmark_impulse/ - Unmark as impulse
# GET    /api/transactions/recent/             - Get recent transactions
# GET    /api/transactions/impulse/            - Get impulse transactions
# GET    /api/transactions/monthly_total/      - Get monthly total
#
# Savings Goal endpoints:
# GET    /api/savings-goals/                   - List all savings goals
# POST   /api/savings-goals/                   - Create new goal
# GET    /api/savings-goals/{id}/              - Get specific goal
# PUT    /api/savings-goals/{id}/              - Update goal
# PATCH  /api/savings-goals/{id}/              - Partial update goal
# DELETE /api/savings-goals/{id}/              - Delete goal
# POST   /api/savings-goals/{id}/add_progress/ - Add money to goal
# GET    /api/savings-goals/active/            - Get active goals
# GET    /api/savings-goals/summary/           - Get goals summary
#
# Analytics endpoints:
# GET    /api/analytics/spending-by-category/  - Get spending by category (pie chart data)
# GET    /api/analytics/spending-trend/        - Get spending trend (30 days, line chart)
# GET    /api/analytics/impulse-analysis/      - Get impulse vs planned spending analysis
# GET    /api/analytics/monthly-summary/       - Get monthly summary metrics
# GET    /api/analytics/weekly-spending/       - Get weekly spending aggregation (?weeks=12)
# GET    /api/analytics/monthly-comparison/     - Compare spending across months (?months=6)
# GET    /api/analytics/yearly-breakdown/      - Year-over-year comparison (?years=3)
# GET    /api/analytics/category-trends/       - Category spending trends over time (?months=6)
# GET    /api/analytics/budget-vs-actual/       - Budget vs actual spending by category
# GET    /api/analytics/spending-heatmap/      - Calendar heatmap data (?year=2024&days=365)
# GET    /api/analytics/time-range/            - Flexible time range data (?start_date&end_date&group_by)