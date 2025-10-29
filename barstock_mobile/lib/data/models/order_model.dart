class OrderModel {
  final int id;
  final String orderNumber;
  final String tableNumber;
  final String status;
  final double total;
  final DateTime createdAt;
  final List<OrderItemModel> items;
  final String? notes;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.tableNumber,
    required this.status,
    required this.total,
    required this.createdAt,
    required this.items,
    this.notes,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? 0,
      orderNumber: json['order_number'] ?? '',
      tableNumber: json['table_number'] ?? '',
      status: json['status'] ?? 'pending',
      total: (json['total'] ?? 0).toDouble(),
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      items: (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItemModel.fromJson(item))
              .toList() ??
          [],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'table_number': tableNumber,
      'status': status,
      'total': total,
      'created_at': createdAt.toIso8601String(),
      'items': items.map((item) => item.toJson()).toList(),
      'notes': notes,
    };
  }
}

class OrderItemModel {
  final int id;
  final String productName;
  final int quantity;
  final double price;
  final String? notes;

  OrderItemModel({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.price,
    this.notes,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? 0,
      productName: json['product_name'] ?? '',
      quantity: json['quantity'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product_name': productName,
      'quantity': quantity,
      'price': price,
      'notes': notes,
    };
  }
}
