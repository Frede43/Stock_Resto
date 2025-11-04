import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

// Types pour les rapports
export interface ExpensesReportSummary {
  total_amount: number;
  total_count: number;
  by_status: Array<{
    status: string;
    total: number;
    count: number;
  }>;
  by_category: Array<{
    category__name: string;
    total: number;
    count: number;
  }>;
  by_payment_method: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
}

export interface ExpenseItem {
  id: number;
  date: string;
  category: string | null;
  description: string;
  amount: number;
  payment_method: string;
  payment_method_display: string;
  status: string;
  status_display: string;
  supplier: string | null;
  created_by: string | null;
  approved_by: string | null;
  receipt_number: string | null;
}

export interface ExpensesReport {
  period: string;
  start_date: string;
  end_date: string;
  summary: ExpensesReportSummary;
  expenses: ExpenseItem[];
}

export interface CreditsReportSummary {
  transactions: {
    total_amount: number;
    total_count: number;
    net_amount: number; // Ajout du net_amount
    by_type: Array<{
      transaction_type: string;
      total: number;
      count: number;
    }>;
    by_payment_method: Array<{
      payment_method: string;
      total: number;
      count: number;
    }>;
  };
  total_debt: number; // Ajout au niveau racine
  active_accounts: number; // Ajout au niveau racine
  accounts: {
    total_accounts: number;
    accounts_with_debt: number;
    total_debt: number;
    total_credit_limit: number;
  };
  top_debtors: Array<{
    id: number;
    customer_name: string;
    phone: string | null;
    current_balance: number;
    credit_limit: number;
    available_credit: number;
    is_over_limit: boolean;
  }>;
}

export interface CreditTransactionItem {
  id: number;
  date: string;
  customer_name: string;
  transaction_type: string;
  transaction_type_display: string;
  amount: number;
  payment_method: string | null;
  payment_method_display: string | null;
  sale_id: number | null;
  notes: string | null;
  created_by: string | null;
}

export interface CreditsReport {
  period: string;
  start_date: string;
  end_date: string;
  summary: CreditsReportSummary;
  transactions: CreditTransactionItem[];
}

// Hook pour le rapport des dépenses
export function useExpensesReport(params?: {
  period?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
  category?: string;
  status?: 'pending' | 'approved' | 'rejected';
}) {
  return useQuery({
    queryKey: ['expenses-report', params],
    queryFn: async () => {
      const response = await apiService.get('/reports/expenses/', { params });
      return response as ExpensesReport;
    },
    staleTime: 0, // Toujours rafraîchir pour avoir les données à jour
    enabled: !!params?.start_date && !!params?.end_date, // Seulement si les dates sont définies
  });
}

// Hook pour le rapport des crédits
export function useCreditsReport(params?: {
  period?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
  account_status?: 'active' | 'suspended' | 'closed';
  transaction_type?: 'debt' | 'payment' | 'adjustment';
}) {
  return useQuery({
    queryKey: ['credits-report', params],
    queryFn: async () => {
      const response = await apiService.get('/reports/credits/', { params });
      return response as CreditsReport;
    },
    staleTime: 0, // Toujours rafraîchir pour avoir les données à jour
    enabled: !!params?.start_date && !!params?.end_date, // Seulement si les dates sont définies
  });
}
