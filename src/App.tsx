import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { NotificationProvider } from "./hooks/use-notifications";
import { WebSocketProvider } from "./components/WebSocketProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { Lock } from "lucide-react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Sales from "./pages/Sales";
import Stocks from "./pages/Stocks";
import StockSync from "./pages/StockSync";
import Supplies from "./pages/Supplies";
import SalesHistory from "./pages/SalesHistory";
import DailyReport from "./pages/DailyReport";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Tables from "./pages/Tables";
import TableDetails from "./pages/TableDetails";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import Suppliers from "./pages/Suppliers";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Monitoring from "./pages/Monitoring";
import Help from "./pages/Help";
import Kitchen from "./pages/Kitchen";
// Dashboard supprimé - Admin utilise Index
import CashierDashboard from "./pages/CashierDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ServerDashboard from "./pages/ServerDashboard";
import NotFound from "./pages/NotFound";

// Composant pour restreindre l'accès aux caissiers
const RestrictedForCashier = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (user?.role === 'cashier') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
            <p className="text-gray-600 mb-4">
              En tant que <strong>Caissier</strong>, vous n'avez pas accès à la gestion des produits.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Cette fonctionnalité est réservée aux Administrateurs et Managers.
            </p>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => window.history.back()} 
              className="w-full"
              variant="outline"
            >
              Retour
            </Button>
            <Button 
              onClick={() => window.location.href = '/sales'} 
              className="w-full"
            >
              Aller au Point de Vente
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          {/* Dashboard supprimé - Admin utilise Index */}

          {/* Role-specific Dashboards */}
          {/* Caissier utilise maintenant la route / (Index.tsx) */}
          <Route path="/manager-dashboard" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/server-dashboard" element={<ProtectedRoute><ServerDashboard /></ProtectedRoute>} />

          {/* Authentication & Profile */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/products" element={
            <ProtectedRoute>
              <RestrictedForCashier>
                <Products />
              </RestrictedForCashier>
            </ProtectedRoute>
          } />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />

          {/* Stock Management - Restreint pour caissiers */}
          <Route path="/stocks" element={
            <ProtectedRoute>
              <RestrictedForCashier>
                <Stocks />
              </RestrictedForCashier>
            </ProtectedRoute>
          } />
          <Route path="/stock-sync" element={
            <ProtectedRoute>
              <RestrictedForCashier>
                <StockSync />
              </RestrictedForCashier>
            </ProtectedRoute>
          } />
          <Route path="/supplies" element={
            <ProtectedRoute>
              <RestrictedForCashier>
                <Supplies />
              </RestrictedForCashier>
            </ProtectedRoute>
          } />
          <Route path="/kitchen" element={
            <ProtectedRoute>
              <RestrictedForCashier>
                <Kitchen />
              </RestrictedForCashier>
            </ProtectedRoute>
          } />

          {/* Financial & Reports */}
          <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
          <Route path="/daily-report" element={<ProtectedRoute><DailyReport /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Operational Pages */}
          <Route path="/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
          <Route path="/tables/:id" element={<ProtectedRoute><TableDetails /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

          {/* Administration */}
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

          {/* System & Support */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          <WebSocketProvider>
          </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryProvider>
);

export default App;
