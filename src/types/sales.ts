/**
 * Types spécifiques aux ventes pour l'interface utilisateur
 */

export type SaleStatus = 
  | "completed" 
  | "pending" 
  | "cancelled" 
  | "refunded" 
  | "preparing" 
  | "ready" 
  | "served" 
  | "paid";

export type PaymentMethod = "cash" | "card" | "mobile";

export interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  time: string;
  table: string;
  server: string;
  customer?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
}

export interface SaleFilters {
  searchTerm: string;
  dateFilter: string;
  serverFilter: string;
  statusFilter: string;
}

export interface SaleStats {
  totalSales: number;
  completedSales: Sale[];
  pendingSales: Sale[];
  completedCount: number;
  pendingCount: number;
}
