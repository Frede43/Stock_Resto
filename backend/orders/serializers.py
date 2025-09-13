from rest_framework import serializers
from .models import Order, OrderItem
from accounts.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'quantity', 
            'unit_price', 'total_price', 'notes', 'status'
        ]
        read_only_fields = ['total_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    server = UserSerializer(read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'server', 
            'status', 'priority', 'total_amount', 'notes', 
            'estimated_time', 'created_at', 'confirmed_at', 
            'ready_at', 'served_at', 'items'
        ]
        read_only_fields = ['order_number', 'created_at', 'total_amount']

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'table', 'priority', 'notes', 'estimated_time', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['server'] = self.context['request'].user
        order = Order.objects.create(**validated_data)
        
        total_amount = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            total_amount += item.total_price
        
        order.total_amount = total_amount
        order.save()
        return order

class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status', 'priority', 'notes', 'estimated_time']
