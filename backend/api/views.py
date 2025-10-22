"""
This file defines API endpoints using Django REST Framework (DRF).

Concepts in play:
- ViewSet: a class that groups related endpoints (actions) together.
- Actions: methods that handle HTTP verbs (e.g., POST/GET) and map to URLs.
- Permissions: rules for who can access endpoints.
- Serializers: convert request data to Python objects and back to JSON.

We provide multiple ViewSets:
1) AuthViewSet: signup, login, logout, token refresh, and "me" endpoints.
2) DashboardViewSet: a read-only endpoint that returns spending metrics for the current user.
3) CategoryViewSet: CRUD operations for spending categories
4) BudgetViewSet: CRUD operations and analytics for budgets
5) TransactionViewSet: CRUD operations and filtering for transactions
6) SavingsGoalViewSet: CRUD operations for savings goals
7) AnalyticsViewSet: Analytics and insights endpoints
"""

# DRF building blocks
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from datetime import datetime, timedelta

# JWT token utilities
from rest_framework_simplejwt.tokens import RefreshToken

# Django models and utilities
from django.contrib.auth.models import User
from django.db.models import Sum, Q, Count
from django.utils import timezone
from decimal import Decimal

# Project serializers and models
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    CategorySerializer,
    BudgetSerializer,
    TransactionSerializer,
    TransactionCreateSerializer,
    SavingsGoalSerializer,
    BudgetCategoryAllocationSerializer,
)
from .models import Category, Budget, Transaction, SavingsGoal, BudgetCategoryAllocation


class AuthViewSet(viewsets.ViewSet):
    """Authentication endpoints (public/signup and login) and protected actions.

    Endpoints provided by this ViewSet (router prefix: /api/auth/):
    - POST /register/  -> create a new user and return JWT tokens
    - POST /login/     -> authenticate and return JWT tokens
    - POST /logout/    -> no-op for JWT (frontend discards tokens)
    - POST /refresh/   -> exchange refresh token for a new access token
    - GET  /me/        -> return the current user's profile
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Create a new user and issue JWT tokens (access + refresh).

        POST /api/auth/register/
        """
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Authenticate an existing user and return JWT tokens.

        POST /api/auth/login/
        """
        serializer = UserLoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout hint for JWT-based auth (frontend should discard tokens).

        POST /api/auth/logout/
        """
        # JWT doesn't require server-side logout, but you can implement token blacklisting
        return Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Exchange refresh token for a new short-lived access token.

        POST /api/auth/refresh/
        """
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return profile details for the currently authenticated user.

        GET /api/auth/me/
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardViewSet(viewsets.ViewSet):
    """Read-only dashboard endpoint that aggregates spending metrics.

    Why a separate ViewSet? Keeps authentication endpoints separate from
    business/reporting logic and makes URLs clean: /api/dashboard/.
    """
    permission_classes = [IsAuthenticated]

    # GET /api/dashboard/
    def list(self, request):
        """Compute and return four dashboard metrics for the current user:
        - totalSavedFromAbandoned: money "saved" from avoided purchases.
        - impulsesResistedThisMonth: count of impulse events resisted this month.
        - spendingByCategory: a map of category -> total spent (excluding avoided).
        - streakDaysWithoutImpulse: consecutive days without any impulse events.

        Notes on heuristics: We avoid schema changes by inferring "abandoned" or
        "resisted" from the presence of those words in description/notes.
        """
        user = request.user
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1) Start from this user's transactions
        tx = Transaction.objects.filter(user=user)

        # 2) Heuristic for "abandoned/resisted" (no schema changes)
        abandoned_q = (
            Q(notes__icontains='abandon') | Q(description__icontains='abandon') |
            Q(notes__icontains='resist') | Q(description__icontains='resist')
        )

        # 3) Total saved from abandoned purchases = sum of amounts tagged by the heuristic
        total_saved = tx.filter(abandoned_q).aggregate(total=Sum('amount'))['total'] or 0

        # 4) Impulses resisted this month = impulse this month + matches heuristic
        resisted_month = tx.filter(is_impulse=True, transaction_date__gte=start_of_month).filter(abandoned_q).count()
        if resisted_month == 0:
            # fallback: count all impulse events this month
            resisted_month = tx.filter(is_impulse=True, transaction_date__gte=start_of_month).count()

        # 5) Spending by category (exclude abandoned/resisted)
        spending = {}
        for row in tx.exclude(abandoned_q).values('category__name').annotate(total=Sum('amount')):
            name = row['category__name'] or 'Uncategorized'
            spending[name] = float(row['total'] or 0)

        # 6) Streak of days without impulse purchases
        def day_has_impulse(dt):
            start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            if timezone.is_naive(start):
                start = timezone.make_aware(start)
            end = start + timedelta(days=1)
            return tx.filter(is_impulse=True, transaction_date__gte=start, transaction_date__lt=end).exists()

        days = 0
        cursor = now
        while True:
            if day_has_impulse(cursor):
                break
            days += 1
            cursor = cursor - timedelta(days=1)
            if days > 3650:
                break

        data = {
            'totalSavedFromAbandoned': float(total_saved),
            'impulsesResistedThisMonth': int(resisted_month),
            'spendingByCategory': spending,
            'streakDaysWithoutImpulse': int(days),
        }

        return Response(data, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category model - manages spending categories

    Endpoints:
    - GET /api/categories/ - List all categories for current user
    - POST /api/categories/ - Create new category
    - POST /api/categories/bulk_create/ - Bulk create multiple categories
    - GET /api/categories/{id}/ - Get specific category
    - PUT /api/categories/{id}/ - Update category
    - PATCH /api/categories/{id}/ - Partial update
    - DELETE /api/categories/{id}/ - Delete category
    - GET /api/categories/statistics/ - Get category spending stats
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for categories

    def get_queryset(self):
        """Return only categories belonging to the logged-in user"""
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically set the user when creating a category"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Bulk create multiple categories at once
        POST /api/categories/bulk_create/

        Body: { "categories": [{"name": "Food"}, {"name": "Transport"}] }
        Returns: List of created categories
        """
        categories_data = request.data.get('categories', [])

        if not isinstance(categories_data, list):
            return Response(
                {'error': 'categories must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not categories_data:
            return Response(
                {'error': 'categories list cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_categories = []
        errors = []

        for idx, category_data in enumerate(categories_data):
            # Validate that each item has a name
            if not isinstance(category_data, dict):
                errors.append({
                    'index': idx,
                    'error': 'Each category must be an object with a name field'
                })
                continue

            name = category_data.get('name', '').strip()
            if not name:
                errors.append({
                    'index': idx,
                    'error': 'Category name is required'
                })
                continue

            # Check if category with this name already exists for this user
            existing = Category.objects.filter(user=request.user, name=name).first()
            if existing:
                # Return existing category instead of creating duplicate
                created_categories.append(existing)
                continue

            # Create the category
            try:
                category = Category.objects.create(
                    user=request.user,
                    name=name
                )
                created_categories.append(category)
            except Exception as e:
                errors.append({
                    'index': idx,
                    'name': name,
                    'error': str(e)
                })

        # Serialize the created categories
        serializer = self.get_serializer(created_categories, many=True)

        response_data = {
            'created': serializer.data,
            'created_count': len(created_categories),
            'errors': errors
        }

        # Return 207 Multi-Status if there were partial errors, 201 if all succeeded
        response_status = status.HTTP_207_MULTI_STATUS if errors else status.HTTP_201_CREATED

        return Response(response_data, status=response_status)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get statistics about categories
        GET /api/categories/statistics/

        Returns count of transactions and total spent per category
        """
        categories = self.get_queryset()
        stats = []

        for category in categories:
            transaction_count = Transaction.objects.filter(
                user=request.user,
                category=category
            ).count()

            total_spent = Transaction.objects.filter(
                user=request.user,
                category=category
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

            stats.append({
                'id': category.id,
                'name': category.name,
                'transaction_count': transaction_count,
                'total_spent': float(total_spent)
            })

        return Response(stats)


class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Budget model - manages budget limits and tracking

    Endpoints:
    - GET /api/budgets/ - List all budgets
    - POST /api/budgets/ - Create new budget
    - GET /api/budgets/{id}/ - Get specific budget
    - PUT /api/budgets/{id}/ - Update budget
    - PATCH /api/budgets/{id}/ - Partial update
    - DELETE /api/budgets/{id}/ - Delete budget
    - GET /api/budgets/active/ - Get only active budgets
    - GET /api/budgets/summary/ - Get spending summary
    - GET /api/budgets/{id}/transactions/ - Get transactions for budget
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only budgets belonging to the logged-in user"""
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically set the user when creating a budget"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only active budgets
        GET /api/budgets/active/
        """
        active_budgets = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_budgets, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='check-exists')
    def check_exists(self, request):
        """
        Check if user has any budgets
        GET /api/budgets/check-exists/
        """
        has_budget = self.get_queryset().exists()
        return Response({'hasBudget': has_budget})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get overall budget summary for dashboard
        GET /api/budgets/summary/

        Returns:
        - Active budget details
        - Total budget income
        - Total spent this month
        - Remaining amount
        - Spending by category
        """
        # Get active budget
        active_budget = self.get_queryset().filter(is_active=True).first()

        if not active_budget:
            return Response({
                'active_budget': None,
                'total_income': 0,
                'total_spent': 0,
                'remaining': 0,
                'categories': []
            })

        # Get current month's spending
        now = timezone.now().date()
        start_of_month = datetime(now.year, now.month, 1).date()

        total_spent = Transaction.objects.filter(
            user=request.user,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        # Get spending by category
        categories = []
        for category in Category.objects.filter(user=request.user):
            category_spent = Transaction.objects.filter(
                user=request.user,
                category=category,
                transaction_date__gte=start_of_month,
                transaction_date__lte=now
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

            transaction_count = Transaction.objects.filter(
                user=request.user,
                category=category,
                transaction_date__gte=start_of_month,
                transaction_date__lte=now
            ).count()

            if transaction_count > 0:  # Only include categories with transactions
                categories.append({
                    'id': category.id,
                    'name': category.name,
                    'spent': float(category_spent),
                    'transaction_count': transaction_count
                })

        return Response({
            'active_budget': {
                'id': active_budget.id,
                'name': active_budget.name,
                'start_date': active_budget.start_date.isoformat(),
                'end_date': active_budget.end_date.isoformat(),
            },
            'total_income': float(active_budget.amount),
            'total_spent': float(total_spent),
            'remaining': float(active_budget.amount - total_spent),
            'categories': categories
        })

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """
        Get all transactions for a specific budget
        GET /api/budgets/{id}/transactions/
        """
        budget = self.get_object()
        transactions = Transaction.objects.filter(
            user=request.user,
            budget=budget
        )
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def allocations(self, request, pk=None):
        """
        Get all category allocations for a specific budget
        GET /api/budgets/{id}/allocations/
        """
        budget = self.get_object()
        allocations = BudgetCategoryAllocation.objects.filter(budget=budget)
        serializer = BudgetCategoryAllocationSerializer(allocations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_allocations(self, request, pk=None):
        """
        Bulk update or create category allocations for a budget
        POST /api/budgets/{id}/update_allocations/

        Body: {
            "allocations": [
                {"category": 1, "allocated_amount": 500.00},
                {"category": 2, "allocated_amount": 300.00}
            ]
        }
        """
        budget = self.get_object()
        allocations_data = request.data.get('allocations', [])

        if not isinstance(allocations_data, list):
            return Response(
                {'error': 'allocations must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_allocations = []
        errors = []

        for idx, alloc_data in enumerate(allocations_data):
            category_id = alloc_data.get('category')
            allocated_amount = alloc_data.get('allocated_amount')

            if not category_id:
                errors.append({
                    'index': idx,
                    'error': 'category is required'
                })
                continue

            if allocated_amount is None:
                errors.append({
                    'index': idx,
                    'error': 'allocated_amount is required'
                })
                continue

            try:
                # Verify category belongs to user
                category = Category.objects.get(id=category_id, user=request.user)

                # Update or create allocation
                allocation, created = BudgetCategoryAllocation.objects.update_or_create(
                    budget=budget,
                    category=category,
                    defaults={'allocated_amount': Decimal(str(allocated_amount))}
                )
                updated_allocations.append(allocation)

            except Category.DoesNotExist:
                errors.append({
                    'index': idx,
                    'category_id': category_id,
                    'error': 'Category not found or does not belong to user'
                })
            except Exception as e:
                errors.append({
                    'index': idx,
                    'error': str(e)
                })

        serializer = BudgetCategoryAllocationSerializer(updated_allocations, many=True)

        response_data = {
            'allocations': serializer.data,
            'updated_count': len(updated_allocations),
            'errors': errors
        }

        response_status = status.HTTP_207_MULTI_STATUS if errors else status.HTTP_200_OK
        return Response(response_data, status=response_status)


class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Transaction model - manages expenses and purchases

    Endpoints:
    - GET /api/transactions/ - List all transactions (with filters)
    - POST /api/transactions/ - Create new transaction
    - GET /api/transactions/{id}/ - Get specific transaction
    - PUT /api/transactions/{id}/ - Update transaction
    - PATCH /api/transactions/{id}/ - Partial update
    - DELETE /api/transactions/{id}/ - Delete transaction
    - POST /api/transactions/{id}/mark_impulse/ - Mark as impulse
    - POST /api/transactions/{id}/unmark_impulse/ - Unmark as impulse
    - GET /api/transactions/recent/ - Get recent transactions
    - GET /api/transactions/impulse/ - Get only impulse purchases
    - GET /api/transactions/monthly_total/ - Get current month total
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return transactions for logged-in user with optional filters

        Query Parameters:
        - category: Filter by category ID
        - budget: Filter by budget ID
        - is_impulse: Filter by impulse status (true/false)
        - start_date: Filter transactions after this date
        - end_date: Filter transactions before this date
        - min_amount: Filter by minimum amount
        - max_amount: Filter by maximum amount
        """
        queryset = Transaction.objects.filter(user=self.request.user)

        # Apply filters from query parameters
        category_id = self.request.query_params.get('category', None)
        budget_id = self.request.query_params.get('budget', None)
        is_impulse = self.request.query_params.get('is_impulse', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        min_amount = self.request.query_params.get('min_amount', None)
        max_amount = self.request.query_params.get('max_amount', None)

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if budget_id:
            queryset = queryset.filter(budget_id=budget_id)

        if is_impulse is not None:
            is_impulse_bool = is_impulse.lower() == 'true'
            queryset = queryset.filter(is_impulse=is_impulse_bool)

        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)

        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)

        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)

        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)

        return queryset

    def get_serializer_class(self):
        """Use different serializers for create vs read operations"""
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer

    def perform_create(self, serializer):
        """Automatically set the user when creating a transaction"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_impulse(self, request, pk=None):
        """
        Mark a transaction as an impulse purchase
        POST /api/transactions/{id}/mark_impulse/
        """
        transaction = self.get_object()
        transaction.is_impulse = True
        transaction.save()

        serializer = self.get_serializer(transaction)
        return Response({
            'message': 'Transaction marked as impulse purchase',
            'transaction': serializer.data
        })

    @action(detail=True, methods=['post'])
    def unmark_impulse(self, request, pk=None):
        """
        Unmark a transaction as an impulse purchase
        POST /api/transactions/{id}/unmark_impulse/
        """
        transaction = self.get_object()
        transaction.is_impulse = False
        transaction.save()

        serializer = self.get_serializer(transaction)
        return Response({
            'message': 'Transaction unmarked as impulse purchase',
            'transaction': serializer.data
        })

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent transactions (last 10)
        GET /api/transactions/recent/
        """
        transactions = self.get_queryset().order_by('-transaction_date')[:10]
        serializer = self.get_serializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def impulse(self, request):
        """
        Get only impulse purchases
        GET /api/transactions/impulse/
        """
        impulse_transactions = self.get_queryset().filter(is_impulse=True)
        serializer = self.get_serializer(impulse_transactions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def monthly_total(self, request):
        """
        Get total spending for current month
        GET /api/transactions/monthly_total/
        """
        now = timezone.now().date()
        start_of_month = datetime(now.year, now.month, 1).date()

        total = self.get_queryset().filter(
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        return Response({
            'month': now.strftime('%B %Y'),
            'total_spent': float(total)
        })


class SavingsGoalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SavingsGoal model - manages savings goals and progress

    Endpoints:
    - GET /api/savings-goals/ - List all savings goals
    - POST /api/savings-goals/ - Create new goal
    - GET /api/savings-goals/{id}/ - Get specific goal
    - PUT /api/savings-goals/{id}/ - Update goal
    - PATCH /api/savings-goals/{id}/ - Partial update
    - DELETE /api/savings-goals/{id}/ - Delete goal
    - POST /api/savings-goals/{id}/add_progress/ - Add money to goal
    - GET /api/savings-goals/active/ - Get uncompleted goals
    - GET /api/savings-goals/summary/ - Get goals summary
    """
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only goals belonging to the logged-in user"""
        return SavingsGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically set the user when creating a goal"""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_progress(self, request, pk=None):
        """
        Add money to a savings goal
        POST /api/savings-goals/{id}/add_progress/

        Body: { "amount": 50.00 }
        """
        goal = self.get_object()
        amount = request.data.get('amount')

        if not amount:
            return Response(
                {'error': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add to current amount
        goal.current_amount += amount

        # Check if goal is now completed
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True

        goal.save()

        serializer = self.get_serializer(goal)
        return Response({
            'message': f'Added ${amount} to goal',
            'goal': serializer.data
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get only uncompleted savings goals
        GET /api/savings-goals/active/
        """
        active_goals = self.get_queryset().filter(is_completed=False)
        serializer = self.get_serializer(active_goals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary of all savings goals
        GET /api/savings-goals/summary/
        """
        goals = self.get_queryset()

        total_target = goals.aggregate(Sum('target_amount'))['target_amount__sum'] or Decimal('0.00')
        total_saved = goals.aggregate(Sum('current_amount'))['current_amount__sum'] or Decimal('0.00')
        completed_count = goals.filter(is_completed=True).count()
        active_count = goals.filter(is_completed=False).count()

        return Response({
            'total_goals': goals.count(),
            'active_goals': active_count,
            'completed_goals': completed_count,
            'total_target': float(total_target),
            'total_saved': float(total_saved),
            'percentage_complete': float((total_saved / total_target * 100)) if total_target > 0 else 0
        })


class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for analytics and insights - read-only data for visualizations

    Endpoints:
    - GET /api/analytics/spending-by-category/ - Pie chart data
    - GET /api/analytics/spending-trend/ - Line chart data (30 days)
    - GET /api/analytics/impulse-analysis/ - Impulse vs planned spending
    - GET /api/analytics/monthly-summary/ - All key metrics for dashboard
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def spending_by_category(self, request):
        """
        Get spending breakdown by category for current month
        GET /api/analytics/spending-by-category/

        Returns data suitable for pie/donut charts
        """
        now = timezone.now().date()
        start_of_month = datetime(now.year, now.month, 1).date()

        # Get all categories with spending this month
        categories = Category.objects.filter(user=request.user)
        data = []

        for category in categories:
            total = Transaction.objects.filter(
                user=request.user,
                category=category,
                transaction_date__gte=start_of_month,
                transaction_date__lte=now
            ).aggregate(Sum('amount'))['amount__sum']

            if total:  # Only include categories with spending
                data.append({
                    'category': category.name,
                    'amount': float(total)
                })

        return Response(data)

    @action(detail=False, methods=['get'])
    def spending_trend(self, request):
        """
        Get daily spending for the last 30 days
        GET /api/analytics/spending-trend/

        Returns data suitable for line charts
        """
        now = timezone.now().date()
        thirty_days_ago = now - timedelta(days=30)

        # Get daily totals
        daily_data = []
        current_date = thirty_days_ago

        while current_date <= now:
            daily_total = Transaction.objects.filter(
                user=request.user,
                transaction_date__date=current_date
            ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

            daily_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'amount': float(daily_total)
            })

            current_date += timedelta(days=1)

        return Response(daily_data)

    @action(detail=False, methods=['get'])
    def impulse_analysis(self, request):
        """
        Get impulse purchase statistics
        GET /api/analytics/impulse-analysis/
        """
        now = timezone.now().date()
        start_of_month = datetime(now.year, now.month, 1).date()

        # Get impulse vs non-impulse spending
        impulse_total = Transaction.objects.filter(
            user=request.user,
            is_impulse=True,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        planned_total = Transaction.objects.filter(
            user=request.user,
            is_impulse=False,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        impulse_count = Transaction.objects.filter(
            user=request.user,
            is_impulse=True,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).count()

        total = impulse_total + planned_total
        impulse_percentage = float((impulse_total / total * 100)) if total > 0 else 0

        return Response({
            'impulse_spending': float(impulse_total),
            'planned_spending': float(planned_total),
            'total_spending': float(total),
            'impulse_percentage': round(impulse_percentage, 2),
            'impulse_count': impulse_count
        })

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """
        Get all key metrics for dashboard
        GET /api/analytics/monthly-summary/
        """
        now = timezone.now().date()
        start_of_month = datetime(now.year, now.month, 1).date()

        # Total spending this month
        monthly_spending = Transaction.objects.filter(
            user=request.user,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        # Total budget
        total_budget = Budget.objects.filter(
            user=request.user,
            is_active=True
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        # Impulse spending
        impulse_spending = Transaction.objects.filter(
            user=request.user,
            is_impulse=True,
            transaction_date__gte=start_of_month,
            transaction_date__lte=now
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')

        # Savings goals progress
        active_goals = SavingsGoal.objects.filter(
            user=request.user,
            is_completed=False
        ).count()

        return Response({
            'monthly_spending': float(monthly_spending),
            'total_budget': float(total_budget),
            'budget_remaining': float(total_budget - monthly_spending),
            'impulse_spending': float(impulse_spending),
            'active_goals': active_goals,
            'is_over_budget': monthly_spending > total_budget
        })
