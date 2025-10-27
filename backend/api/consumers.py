"""
WebSocket consumers for real-time updates

This module handles WebSocket connections for real-time transaction updates.
Uses Django Channels to broadcast transaction changes across connected clients.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User


class TransactionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for transaction updates.

    Handles:
    - User authentication
    - Room management (per-user transaction updates)
    - Broadcasting transaction create/update/delete events
    """

    async def connect(self):
        """
        Handle WebSocket connection.
        Authenticate user and join their personal transaction room.
        """
        # Get user from scope (set by AuthMiddleware)
        self.user = self.scope.get('user')

        # Reject unauthenticated connections
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Create a room name based on user ID (each user has their own room)
        self.room_name = f'transactions_{self.user.id}'
        self.room_group_name = f'transactions_group_{self.user.id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send welcome message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to transaction updates'
        }))

    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        Leave the transaction room.
        """
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Handle messages from WebSocket.
        Currently not processing client messages, but could be extended.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            # Could add ping/pong or other client messages here
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def transaction_update(self, event):
        """
        Handle transaction update event.
        Called when a transaction is created, updated, or deleted.
        """
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'transaction_update',
            'action': event['action'],  # 'created', 'updated', 'deleted'
            'transaction': event['transaction'],
            'budget_update': event.get('budget_update'),  # Optional budget balance update
        }))

    async def budget_update(self, event):
        """
        Handle budget update event.
        Called when budget balances change.
        """
        await self.send(text_data=json.dumps({
            'type': 'budget_update',
            'budget': event['budget']
        }))
