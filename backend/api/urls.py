from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, DashboardViewSet, BudgetViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]

# Available endpoints:
# Auth:
#   POST   /api/auth/register/
#   POST   /api/auth/login/
#   POST   /api/auth/logout/
#   POST   /api/auth/refresh/
#   GET    /api/auth/me/
#
# Budgets:
#   GET    /api/budgets/              - List all budgets
#   POST   /api/budgets/              - Create new budget
#   GET    /api/budgets/{id}/         - Get specific budget
#   PUT    /api/budgets/{id}/         - Update budget
#   DELETE /api/budgets/{id}/         - Delete budget
#   GET    /api/budgets/current/      - Get current active budget
#   GET    /api/budgets/check-exists/ - Check if user has budgets
#   GET    /api/budgets/summary/      - Get budget summary
#   POST   /api/budgets/{id}/activate/ - Activate specific budget
#
# Categories:
#   GET    /api/categories/           - List all categories
#   POST   /api/categories/           - Create new category
#   GET    /api/categories/{id}/      - Get specific category
#   PUT    /api/categories/{id}/      - Update category
#   DELETE /api/categories/{id}/      - Delete category
#   POST   /api/categories/bulk-create/ - Create multiple categories
