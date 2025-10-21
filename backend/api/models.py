# models.py
# This file defines the structure of your database tables

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal

# A Category is like a folder for organizing expenses (Food, Transport, etc.)
class Category(models.Model):
    # CharField = text field with max length
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#6B7280')
    # ForeignKey = connects this category to a specific user
    # on_delete=models.CASCADE means: if user is deleted, delete their categories too
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # auto_now_add=True means Django automatically sets this when created
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    # This method controls how the category appears when printed
    def __str__(self):
        return self.name


# A Budget represents money set aside for a time period
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    monthly_limit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # DateField stores just the date
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'name', 'start_date']
    
    def __str__(self):
        return f"{self.user.username} - {self.category.name} - ${self.monthly_limit}"
    
    # Example: my_budget.total_spent will run this code
    @property
    def total_spent(self):
        # Get all transactions linked to this budget
        transactions = self.transactions.all()
        
        # Add up all the amounts
        total = 0
        for transaction in transactions:
            total += transaction.amount
        return total
    
    @property
    def remaining(self):
        # How much money is left in the budget
        return self.amount - self.total_spent


# A Transaction is a single purchase or expense
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # null=True, blank=True means this field is optional
    # SET_NULL means if budget is deleted, just set this to None (don't delete transaction)
    budget = models.ForeignKey(
        Budget, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='transactions'  # Lets us do: budget.transactions.all()
    )
    
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    transaction_date = models.DateTimeField()
    
    # Flag to mark impulse purchases
    is_impulse = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"


# Simple model to track savings goals
class SavingsGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    target_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - ${self.current_amount}/${self.target_amount}"
    
    @property
    def percentage_complete(self):
        # Calculate what % of the goal is complete
        if self.target_amount == 0:
            return 0
        return min(100, (self.current_amount / self.target_amount) * 100)
    
    def remaining_amount(self):
        return max(0, self.target_amount - self.current_amount)
