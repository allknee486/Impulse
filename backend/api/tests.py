from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta

from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Category, Transaction


class AnalyticsViewSetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='password123', email='a@example.com')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        food = Category.objects.create(name='Food', user=self.user)
        travel = Category.objects.create(name='Travel', user=self.user)

        now = timezone.now()

        # Within last 30 days
        Transaction.objects.create(
            user=self.user,
            category=food,
            amount=50,
            description='Groceries',
            notes='',
            transaction_date=now - timedelta(days=2),
            is_impulse=False,
        )

        Transaction.objects.create(
            user=self.user,
            category=travel,
            amount=100,
            description='Cab ride',
            notes='impulse',
            transaction_date=now - timedelta(days=7),
            is_impulse=True,
        )

        # Older than 30 days but in previous months
        Transaction.objects.create(
            user=self.user,
            category=food,
            amount=75,
            description='Dining out',
            notes='',
            transaction_date=now - timedelta(days=40),
            is_impulse=False,
        )

        Transaction.objects.create(
            user=self.user,
            category=None,
            amount=25,
            description='Misc',
            notes='',
            transaction_date=now - timedelta(days=70),
            is_impulse=False,
        )

    def test_analytics_list(self):
        url = reverse('analytics-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.json()
        # Keys present
        for key in [
            'totalSpent', 'monthlyTotals', 'byCategory', 'avgDailySpend30d', 'impulseRate30d'
        ]:
            self.assertIn(key, data)

        # Totals: 50 + 100 + 75 + 25 = 250
        self.assertAlmostEqual(data['totalSpent'], 250.0, places=2)

        # byCategory totals
        by_cat = data['byCategory']
        self.assertAlmostEqual(by_cat.get('Food', 0.0), 125.0, places=2)
        self.assertAlmostEqual(by_cat.get('Travel', 0.0), 100.0, places=2)
        self.assertAlmostEqual(by_cat.get('Uncategorized', 0.0), 25.0, places=2)

        # avgDailySpend30d: (50 + 100) / 30
        self.assertAlmostEqual(data['avgDailySpend30d'], (150.0/30.0), places=4)

        # impulseRate30d: 1 impulse out of 2 transactions in last 30 days = 50%
        self.assertAlmostEqual(data['impulseRate30d'], 50.0, places=2)

        # monthlyTotals should be non-empty and contain dicts with month and total
        self.assertIsInstance(data['monthlyTotals'], list)
        if data['monthlyTotals']:
            self.assertIn('month', data['monthlyTotals'][0])
            self.assertIn('total', data['monthlyTotals'][0])
