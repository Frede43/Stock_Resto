import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { NotificationProvider } from "./hooks/use-notifications";
import { WebSocketProvider } from "./components/WebSocketProvider";
import { SidebarProvider } from "./context/SidebarContext";
import { Layout } from "./components/layout/ModernLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { OfflineIndicator } from "./components/OfflineIndicator";
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
import OfflineTest from "./pages/OfflineTest";
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
          <SidebarProvider>
            <NotificationProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
          {/* Dashboard supprimé - Admin utilise Index */}

          {/* Role-specific Dashboards */}
          {/* Caissier utilise maintenant la route / (Index.tsx) */}
          <Route path="/manager-dashboard" element={<ProtectedRoute><Layout><ManagerDashboard /></Layout></ProtectedRoute>} />
          <Route path="/server-dashboard" element={<ProtectedRoute><Layout><ServerDashboard /></Layout></ProtectedRoute>} />

          {/* Authentication & Profile */}
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/products" element={
            <ProtectedRoute>
              <Layout>
                <RestrictedForCashier>
                  <Products />
                </RestrictedForCashier>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sales" element={<ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>} />

          {/* Stock Management - Restreint pour caissiers */}
          <Route path="/stocks" element={
            <ProtectedRoute>
              <Layout>
                <RestrictedForCashier>
                  <Stocks />
                </RestrictedForCashier>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/stock-sync" element={
            <ProtectedRoute>
              <Layout>
                <RestrictedForCashier>
                  <StockSync />
                </RestrictedForCashier>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/supplies" element={
            <ProtectedRoute>
              <Layout>
                <RestrictedForCashier>
                  <Supplies />
                </RestrictedForCashier>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/kitchen" element={
            <ProtectedRoute>
              <Layout>
                <RestrictedForCashier>
                  <Kitchen />
                </RestrictedForCashier>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Financial & Reports */}
          <Route path="/sales-history" element={<ProtectedRoute><Layout><SalesHistory /></Layout></ProtectedRoute>} />
          <Route path="/daily-report" element={<ProtectedRoute><Layout><DailyReport /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />

          {/* Operational Pages */}
          <Route path="/tables" element={<ProtectedRoute><Layout><Tables /></Layout></ProtectedRoute>} />
          <Route path="/tables/:id" element={<ProtectedRoute><Layout><TableDetails /></Layout></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />

          {/* Administration */}
          <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />

          {/* System & Support */}
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Layout><Monitoring /></Layout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
          
          {/* Test Offline */}
          <Route path="/offline-test" element={<ProtectedRoute><Layout><OfflineTest /></Layout></ProtectedRoute>} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          <WebSocketProvider>
            <></>
          </WebSocketProvider>
          
          {/* Indicateur de statut offline/online */}
          <OfflineIndicator />
          </NotificationProvider>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryProvider>
);

export default App;
