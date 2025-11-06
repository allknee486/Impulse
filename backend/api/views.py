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
from django.db.models import Sum, Q, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

# Project serializers and models
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer
)
from .models import Transaction


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


class AnalyticsViewSet(viewsets.ViewSet):
    """Aggregated analytics for user spending.

    GET /api/analytics/
    Returns:
    - totalSpent: total amount across all transactions
    - monthlyTotals: list of { month: YYYY-MM, total: number } for last 6 months
    - byCategory: { categoryName: total }
    - avgDailySpend30d: average daily spend over the last 30 days
    - impulseRate30d: percentage of transactions marked is_impulse in last 30 days
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        now = timezone.now()
        start_30d = now - timedelta(days=30)

        qs = Transaction.objects.filter(user=user)

        # total spent (all time)
        total_spent = qs.aggregate(total=Sum('amount'))['total'] or 0

        # monthly totals for last 6 months (including current)
        start_6m = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=5*31))
        monthly_qs = (
            qs.filter(transaction_date__gte=start_6m)
              .annotate(month=TruncMonth('transaction_date'))
              .values('month')
              .annotate(total=Sum('amount'))
              .order_by('month')
        )
        monthly_totals = []
        for row in monthly_qs:
            m = row['month']
            label = f"{m.year:04d}-{m.month:02d}"
            monthly_totals.append({
                'month': label,
                'total': float(row['total'] or 0),
            })

        # spending by category (all time)
        by_category = {}
        for row in qs.values('category__name').annotate(total=Sum('amount')):
            name = row['category__name'] or 'Uncategorized'
            by_category[name] = float(row['total'] or 0)

        # average daily spend last 30 days
        last_30_total = qs.filter(transaction_date__gte=start_30d).aggregate(total=Sum('amount'))['total'] or 0
        avg_daily_30 = float(last_30_total) / 30.0

        # impulse rate last 30 days
        last_30 = qs.filter(transaction_date__gte=start_30d)
        last_30_count = last_30.aggregate(c=Count('id'))['c'] or 0
        last_30_impulse = last_30.filter(is_impulse=True).aggregate(c=Count('id'))['c'] or 0
        impulse_rate = float(last_30_impulse) / float(last_30_count) * 100.0 if last_30_count else 0.0

        data = {
            'totalSpent': float(total_spent),
            'monthlyTotals': monthly_totals,
            'byCategory': by_category,
            'avgDailySpend30d': avg_daily_30,
            'impulseRate30d': impulse_rate,
        }

        return Response(data, status=status.HTTP_200_OK)
