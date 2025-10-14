from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
]

# This creates the following endpoints:
# POST   /api/auth/register/  - Register new user
# POST   /api/auth/login/     - Login user
# POST   /api/auth/logout/    - Logout user
# POST   /api/auth/refresh/   - Refresh access token
# GET    /api/auth/me/        - Get current user info