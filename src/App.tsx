import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/QueryProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import { NotificationProvider } from "./hooks/use-notifications";
import ProtectedRoute from "./components/ProtectedRoute";
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
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />

          {/* Stock Management */}
          <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
          <Route path="/stock-sync" element={<ProtectedRoute><StockSync /></ProtectedRoute>} />
          <Route path="/supplies" element={<ProtectedRoute><Supplies /></ProtectedRoute>} />
          <Route path="/kitchen" element={<ProtectedRoute><Kitchen /></ProtectedRoute>} />

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
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryProvider>
);

export default App;
