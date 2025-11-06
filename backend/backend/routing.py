"""
WebSocket URL routing configuration.

This file defines WebSocket URL patterns similar to Django's urls.py.
"""

from django.urls import re_path
from api.consumers import TransactionConsumer

websocket_urlpatterns = [
    re_path(r'ws/transactions/$', TransactionConsumer.as_asgi()),
]
