from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    impulse_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('50.00'),
        help_text="Amount above which purchases are flagged as potential impulse buys"
    )
    currency = models.CharField(max_length=3, default='USD')
    receive_alerts = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class Budget(models.Model):
    """Budget for a specific time period"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    name = models.CharField(max_length=200)
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField()
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='budgets'
    )
    is_active = models.BooleanField(default=True)
    alert_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('80.00'),
        help_text="Percentage threshold for budget alerts (e.g., 80 for 80%)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} - ${self.amount} ({self.period})"

    @property
    def total_spent(self):
        """Calculate total spending for this budget"""
        transactions = self.transactions.all()
        return sum(t.amount for t in transactions)

    @property
    def remaining(self):
        """Calculate remaining budget"""
        return self.amount - self.total_spent

    @property
    def percentage_used(self):
        """Calculate percentage of budget used"""
        if self.amount == 0:
            return 0
        return (self.total_spent / self.amount) * 100

    @property
    def is_over_budget(self):
        """Check if budget is exceeded"""
        return self.total_spent > self.amount

    @property
    def is_near_limit(self):
        """Check if budget is near alert threshold"""
        return self.percentage_used >= self.alert_threshold

class Transaction(models.Model):
    """Individual spending transaction"""
    TRANSACTION_TYPES = [
        ('expense', 'Expense'),
        ('income', 'Income'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    budget = models.ForeignKey(
        Budget, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='transactions'
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='transactions'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    description = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES,
        default='expense'
    )
    transaction_date = models.DateTimeField()
    is_impulse = models.BooleanField(
        default=False,
        help_text="Flag for impulse purchases"
    )
    receipt_image = models.ImageField(
        upload_to='receipts/%Y/%m/%d/',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-transaction_date']

    def __str__(self):
        return f"{self.description} - ${self.amount} ({self.transaction_date.date()})"
