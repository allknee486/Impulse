# models.py
# This file defines the structure of your database tables

from django.db import models
from django.contrib.auth.models import User  # Built-in Django user system

# A Category is like a folder for organizing expenses (Food, Transport, etc.)
class Category(models.Model):
    # CharField = text field with max length
    name = models.CharField(max_length=100)
    
    # ForeignKey = connects this category to a specific user
    # on_delete=models.CASCADE means: if user is deleted, delete their categories too
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # auto_now_add=True means Django automatically sets this when created
    created_at = models.DateTimeField(auto_now_add=True)
    
    # This method controls how the category appears when printed
    def __str__(self):
        return self.name


# A Budget represents money set aside for a time period
class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    
    # DecimalField is better than FloatField for money (more precise)
    # max_digits=10 means up to 10 total digits
    # decimal_places=2 means 2 digits after the decimal (cents)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # DateField stores just the date (not time)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # BooleanField = True/False checkbox
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - ${self.amount}"
    
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
    
    # TextField = unlimited length text (for longer notes)
    notes = models.TextField(blank=True)
    
    # DateTimeField stores date AND time
    transaction_date = models.DateTimeField()
    
    # Flag to mark impulse purchases
    is_impulse = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.description} - ${self.amount}"


# Track how much money is allocated to each category within a budget
class BudgetCategoryAllocation(models.Model):
    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name='category_allocations'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE
    )
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure each category only appears once per budget
        unique_together = ['budget', 'category']

    def __str__(self):
        return f"{self.budget.name} - {self.category.name}: ${self.allocated_amount}"

    @property
    def spent_amount(self):
        """Calculate how much has been spent in this category for this budget"""
        from django.db.models import Sum
        total = Transaction.objects.filter(
            budget=self.budget,
            category=self.category
        ).aggregate(Sum('amount'))['amount__sum']
        return total or 0

    @property
    def remaining_amount(self):
        """Calculate remaining allocation for this category"""
        return self.allocated_amount - self.spent_amount


# Simple model to track savings goals
class SavingsGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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
        return (self.current_amount / self.target_amount) * 100

    def remaining_amount(self):
        """Calculate remaining amount needed to reach goal"""
        return self.target_amount - self.current_amount
