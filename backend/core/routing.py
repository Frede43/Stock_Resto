"""
Routing WebSocket pour BarStockWise
"""

from django.urls import re_path
from sales.consumers import TableStatusConsumer, ReservationConsumer

websocket_urlpatterns = [
    re_path(r'ws/tables/$', TableStatusConsumer.as_asgi()),
    re_path(r'ws/reservations/$', ReservationConsumer.as_asgi()),
]
