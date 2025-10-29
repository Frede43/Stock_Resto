import '../models/user_model.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';

class MockData {
  // Utilisateur de démonstration
  static UserModel get demoUser => UserModel(
        id: 1,
        username: 'admin',
        email: 'admin@barstockwise.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'manager',
        avatar: null,
      );

  // Produits de démonstration
  static List<ProductModel> get demoProducts => [
        ProductModel(
          id: 1,
          name: 'Pizza Margherita',
          description: 'Tomate, mozzarella, basilic',
          price: 12.50,
          stock: 15,
          category: 'Pizza',
          isAvailable: true,
        ),
        ProductModel(
          id: 2,
          name: 'Burger Classique',
          description: 'Steak, salade, tomate, oignon',
          price: 9.90,
          stock: 8,
          category: 'Burger',
          isAvailable: true,
        ),
        ProductModel(
          id: 3,
          name: 'Pâtes Carbonara',
          description: 'Pâtes, lardons, crème, parmesan',
          price: 11.00,
          stock: 5,
          category: 'Pâtes',
          isAvailable: true,
        ),
        ProductModel(
          id: 4,
          name: 'Salade César',
          description: 'Salade, poulet, parmesan, croûtons',
          price: 8.50,
          stock: 12,
          category: 'Salade',
          isAvailable: true,
        ),
        ProductModel(
          id: 5,
          name: 'Coca-Cola',
          description: 'Boisson gazeuse 33cl',
          price: 2.50,
          stock: 50,
          category: 'Boisson',
          isAvailable: true,
        ),
        ProductModel(
          id: 6,
          name: 'Eau minérale',
          description: 'Eau minérale 50cl',
          price: 1.50,
          stock: 30,
          category: 'Boisson',
          isAvailable: true,
        ),
      ];

  // Commandes de démonstration
  static List<OrderModel> get demoOrders => [
        OrderModel(
          id: 1,
          orderNumber: 'ORD-001',
          tableNumber: 'Table 5',
          status: 'pending',
          total: 25.40,
          createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
          items: [
            OrderItemModel(
                id: 1,
                productName: 'Pizza Margherita',
                quantity: 1,
                price: 12.50),
            OrderItemModel(
                id: 2, productName: 'Coca-Cola', quantity: 2, price: 2.50),
          ],
          notes: 'Pizza bien cuite',
        ),
        OrderModel(
          id: 2,
          orderNumber: 'ORD-002',
          tableNumber: 'Table 12',
          status: 'preparing',
          total: 19.90,
          createdAt: DateTime.now().subtract(const Duration(minutes: 8)),
          items: [
            OrderItemModel(
                id: 3,
                productName: 'Burger Classique',
                quantity: 1,
                price: 9.90),
            OrderItemModel(
                id: 4, productName: 'Frites', quantity: 1, price: 4.50),
            OrderItemModel(
                id: 5, productName: 'Eau minérale', quantity: 1, price: 1.50),
          ],
        ),
        OrderModel(
          id: 3,
          orderNumber: 'ORD-003',
          tableNumber: 'Table 3',
          status: 'ready',
          total: 35.50,
          createdAt: DateTime.now().subtract(const Duration(minutes: 25)),
          items: [
            OrderItemModel(
                id: 6,
                productName: 'Pizza Margherita',
                quantity: 2,
                price: 12.50),
            OrderItemModel(
                id: 7, productName: 'Salade César', quantity: 1, price: 8.50),
            OrderItemModel(
                id: 8, productName: 'Coca-Cola', quantity: 2, price: 2.50),
          ],
        ),
      ];

  // Statistiques du tableau de bord
  static Map<String, dynamic> get dashboardStats => {
        'total_orders_today': 24,
        'pending_orders': 3,
        'completed_orders': 18,
        'total_revenue_today': 456.80,
        'average_order_value': 19.03,
        'top_selling_product': 'Pizza Margherita',
        'low_stock_products': [
          {'name': 'Pâtes Carbonara', 'stock': 5},
          {'name': 'Burger Classique', 'stock': 8},
        ],
      };

  // Notifications de démonstration
  static List<Map<String, dynamic>> get demoNotifications => [
        {
          'id': 1,
          'title': 'Stock faible',
          'message': 'Pâtes Carbonara - 5 unités restantes',
          'type': 'stock_alert',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 10)),
          'isRead': false,
        },
        {
          'id': 2,
          'title': 'Nouvelle commande',
          'message': 'Commande #ORD-004 - Table 7',
          'type': 'new_order',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 5)),
          'isRead': false,
        },
        {
          'id': 3,
          'title': 'Commande prête',
          'message': 'Commande #ORD-002 - Table 12',
          'type': 'order_ready',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 2)),
          'isRead': true,
        },
      ];
}
