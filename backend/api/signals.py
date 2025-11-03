"""
Signal handlers for real-time transaction updates.

This module broadcasts transaction changes to connected WebSocket clients.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Transaction, Budget
from .serializers import TransactionSerializer


@receiver(post_save, sender=Transaction)
def transaction_saved(sender, instance, created, **kwargs):
    """
    Broadcast transaction create/update event to WebSocket clients.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    # Serialize the transaction
    serializer = TransactionSerializer(instance)

    # Determine action
    action = 'created' if created else 'updated'

    # Get budget update if transaction has a budget
    budget_update = None
    if instance.budget:
        budget_update = {
            'id': instance.budget.id,
            'total_spent': float(instance.budget.total_spent),
            'remaining': float(instance.budget.remaining),
        }

    # Send to user's transaction group
    room_group_name = f'transactions_group_{instance.user.id}'

    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'transaction_update',
            'action': action,
            'transaction': serializer.data,
            'budget_update': budget_update,
        }
    )


@receiver(post_delete, sender=Transaction)
def transaction_deleted(sender, instance, **kwargs):
    """
    Broadcast transaction delete event to WebSocket clients.
    """
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    # Send minimal transaction data (just ID)
    transaction_data = {
        'id': instance.id,
    }

    # Get budget update if transaction had a budget
    budget_update = None
    if instance.budget:
        budget_update = {
            'id': instance.budget.id,
            'total_spent': float(instance.budget.total_spent),
            'remaining': float(instance.budget.remaining),
        }

    # Send to user's transaction group
    room_group_name = f'transactions_group_{instance.user.id}'

    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': 'transaction_update',
            'action': 'deleted',
            'transaction': transaction_data,
            'budget_update': budget_update,
        }
    )
