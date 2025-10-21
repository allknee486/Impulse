"""
This file defines API endpoints using Django REST Framework (DRF).

Concepts in play:
- ViewSet: a class that groups related endpoints (actions) together.
- Actions: methods that handle HTTP verbs (e.g., POST/GET) and map to URLs.
- Permissions: rules for who can access endpoints.
- Serializers: convert request data to Python objects and back to JSON.

We provide two ViewSets:
1) AuthViewSet: signup, login, logout, token refresh, and "me" endpoints.
2) DashboardViewSet: a read-only endpoint that returns spending metrics for the current user.
"""

# DRF building blocks
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

# JWT token utilities
from rest_framework_simplejwt.tokens import RefreshToken

# Django models and utilities
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

# Project serializers and models
from .models import Budget, Category
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    BudgetSerializer,
    CategorySerializer,
    BudgetSummarySerializer,
)


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


class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Budget CRUD operations
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return budgets for current user"""
        return Budget.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """Set user when creating budget"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get the current active budget
        GET /api/budgets/current/
        """
        today = timezone.now().date()
        budget = Budget.objects.filter(
            user=request.user,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).first()

        if not budget:
            return Response(
                {'detail': 'No active budget found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(budget)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check_exists(self, request):
        """
        Check if user has any budgets
        GET /api/budgets/check-exists/
        """
        has_budget = Budget.objects.filter(user=request.user).exists()
        return Response({'hasBudget': has_budget})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get budget summary with spending overview
        GET /api/budgets/summary/
        """
        # Get current active budget
        today = timezone.now().date()
        active_budget = Budget.objects.filter(
            user=request.user,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).first()

        # Calculate totals
        if active_budget:
            total_income = active_budget.amount
            total_spent = active_budget.total_spent
            remaining = active_budget.remaining
        else:
            total_income = 0
            total_spent = 0
            remaining = 0

        # Get categories
        categories = Category.objects.filter(user=request.user)
        category_data = []

        for category in categories:
            cat_transactions = category.transaction_set.filter(
                transaction_date__gte=active_budget.start_date if active_budget else today,
                transaction_date__lte=active_budget.end_date if active_budget else today
            )
            cat_spent = sum(t.amount for t in cat_transactions)

            category_data.append({
                'id': category.id,
                'name': category.name,
                'spent': float(cat_spent),
                'transaction_count': cat_transactions.count()
            })

        summary_data = {
            'total_income': float(total_income),
            'total_allocated': float(total_income),  # For now, same as income
            'total_spent': float(total_spent),
            'remaining': float(remaining),
            'categories': category_data,
            'active_budget': BudgetSerializer(active_budget).data if active_budget else None
        }

        serializer = BudgetSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a specific budget (deactivate others)
        POST /api/budgets/{id}/activate/
        """
        budget = self.get_object()

        # Deactivate all other budgets
        Budget.objects.filter(user=request.user).exclude(id=budget.id).update(is_active=False)

        # Activate this budget
        budget.is_active = True
        budget.save()

        serializer = self.get_serializer(budget)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return categories for current user"""
        return Category.objects.filter(user=self.request.user).order_by('name')

    def perform_create(self, serializer):
        """Set user when creating category"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple categories at once
        POST /api/categories/bulk-create/
        Body: {
            "categories": [
                {"name": "Food"},
                {"name": "Transport"},
                ...
            ]
        }
        """
        categories_data = request.data.get('categories', [])

        if not categories_data:
            return Response(
                {'error': 'No categories provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                user=request.user,
                name=cat_data.get('name')
            )
            created_categories.append(category)

        serializer = self.get_serializer(created_categories, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
