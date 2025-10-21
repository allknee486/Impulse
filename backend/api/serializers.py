from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Budget, Category


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
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'user', 'created_at', 'spent', 'remaining']
        read_only_fields = ['user', 'created_at']

    def get_spent(self, obj):
        """Calculate total spent in this category"""
        transactions = obj.transaction_set.all()
        return sum(t.amount for t in transactions)

    def get_remaining(self, obj):
        """Calculate remaining amount in category"""
        # This is a placeholder - will be updated when we add category allocations
        return 0


class BudgetCategorySerializer(serializers.Serializer):
    """Serializer for category allocation within a budget"""
    category_name = serializers.CharField(max_length=100)
    allocated_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)


class BudgetSerializer(serializers.ModelSerializer):
    categories = BudgetCategorySerializer(many=True, write_only=True, required=False)
    total_spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    category_allocations = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'user', 'name', 'amount', 'start_date', 'end_date',
            'is_active', 'created_at', 'total_spent', 'remaining',
            'categories', 'category_allocations'
        ]
        read_only_fields = ['user', 'created_at', 'total_spent', 'remaining']

    def get_total_spent(self, obj):
        """Calculate total spent from this budget"""
        return obj.total_spent

    def get_remaining(self, obj):
        """Calculate remaining budget"""
        return obj.remaining

    def get_category_allocations(self, obj):
        """Get all categories with their allocations"""
        # For now, return basic category info
        # Will be enhanced when we add proper category allocations
        categories = Category.objects.filter(user=obj.user)
        return [{'id': c.id, 'name': c.name} for c in categories]

    def validate(self, data):
        """Validate budget data"""
        # Ensure end_date is after start_date
        if 'start_date' in data and 'end_date' in data:
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })

        # Validate total category allocations don't exceed budget amount
        categories = data.get('categories', [])
        if categories:
            total_allocated = sum(c['allocated_amount'] for c in categories)
            if total_allocated > data.get('amount', 0):
                raise serializers.ValidationError({
                    'categories': f'Total allocated (${total_allocated}) exceeds budget amount (${data["amount"]})'
                })

        return data

    def create(self, validated_data):
        """Create budget and associated categories"""
        categories_data = validated_data.pop('categories', [])
        budget = Budget.objects.create(**validated_data)

        # Create categories if provided
        for category_data in categories_data:
            Category.objects.get_or_create(
                user=budget.user,
                name=category_data['category_name']
            )

        return budget

    def update(self, instance, validated_data):
        """Update budget"""
        categories_data = validated_data.pop('categories', None)

        # Update budget fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update categories if provided
        if categories_data is not None:
            for category_data in categories_data:
                Category.objects.get_or_create(
                    user=instance.user,
                    name=category_data['category_name']
                )

        return instance


class BudgetSummarySerializer(serializers.Serializer):
    """Serializer for budget summary/overview"""
    total_income = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_allocated = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)
    remaining = serializers.DecimalField(max_digits=10, decimal_places=2)
    categories = serializers.ListField()
    active_budget = BudgetSerializer(allow_null=True)
