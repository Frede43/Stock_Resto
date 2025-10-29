import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/websocket_service.dart';
import 'services/notification_service.dart';
import 'services/dashboard_service.dart';
import 'services/orders_service.dart';
import 'services/profile_service.dart';
import 'presentation/pages/login_page.dart';
import 'presentation/pages/home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser les locales pour le formatage des dates
  await initializeDateFormatting('fr_FR', null);
  
  // Initialiser les services
  await NotificationService.initialize();
  ApiService().initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => DashboardService()),
        ChangeNotifierProvider(create: (_) => OrdersService()),
        ChangeNotifierProvider(create: (_) => ProfileService()),
        Provider(create: (_) => ApiService()),
        Provider(create: (_) => WebSocketService()),
      ],
      child: MaterialApp(
        title: 'BarStockWise Mobile',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: Consumer<AuthService>(
          builder: (context, authService, child) {
            return FutureBuilder<bool>(
              future: authService.checkLoginStatus(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Scaffold(
                    body: Center(
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                return snapshot.data == true ? const HomePage() : const LoginPage();
              },
            );
          },
        ),
      ),
    );
  }
}
