from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import Category, Budget, Transaction, SavingsGoal, BudgetCategoryAllocation
from decimal import Decimal


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords must match."})

        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})

        # Check if username already exists
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})

        return data

    def create(self, validated_data):
        # Remove password_confirm before creating user
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        # Create user and set password securely
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        # Authenticate user
        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'user', 'name', 'amount', 'is_active', 'created_at', 'start_date', 'end_date']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_start_date(self, value):
        # Only validate start_date for new budgets, not when updating existing ones
        if not self.instance and value < timezone.now().date():
            raise serializers.ValidationError("Start date cannot be in the past.")
        return value

    def validate_end_date(self, value):
        start_date = self.initial_data.get('start_date')
        # Convert string to date if needed
        if isinstance(start_date, str):
            from datetime import datetime
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if start_date and value < start_date:
            raise serializers.ValidationError("End date cannot be before start date.")
        return value

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'budget', 'budget_name', 'category', 'category_name',
            'amount', 'description', 'notes', 'transaction_date',
            'is_impulse', 'created_at', 'username'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'category_name', 'budget_name', 'username']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_category(self, value):
        """Ensure category belongs to the current user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only use your own categories.")
        return value

    def validate_budget(self, value):
        """Ensure budget belongs to the current user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only use your own budgets.")
        return value

class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['budget', 'category', 'amount', 'description', 'notes', 'transaction_date', 'is_impulse']
        read_only_fields = ['user', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_category(self, value):
        """Ensure category belongs to the current user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only use your own categories.")
        return value

    def validate_budget(self, value):
        """Ensure budget belongs to the current user"""
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("You can only use your own budgets.")
        return value

class SavingsGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingsGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'target_date', 'is_completed', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Target amount must be greater than 0.")
        return value

    def validate_current_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Current amount cannot be negative.")
        return value

    def validate_target_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Target date cannot be in the past.")
        return value

    def validate(self, value):
        current_amount = value.get('current_amount', Decimal('0.00'))
        target_amount = value.get('target_amount', Decimal('0.00'))

        # If updating an existing goal, use the current amount and target amount from the instance
        if self.instance:
            current_amount = value.get('current_amount', self.instance.current_amount)
            target_amount = value.get('target_amount', self.instance.target_amount)

        if current_amount > target_amount:
            pass
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['remaining_amount'] = instance.remaining_amount()
        data['percentage_complete'] = instance.percentage_complete
        return data


class BudgetCategoryAllocationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    remaining_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = BudgetCategoryAllocation
        fields = [
            'id',
            'budget',
            'category',
            'category_name',
            'allocated_amount',
            'spent_amount',
            'remaining_amount',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_allocated_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Allocated amount cannot be negative.")
        return value
