import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// Types
export interface CreditAccount {
  id: number;
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  status: 'active' | 'suspended' | 'closed';
  status_display: string;
  is_over_limit: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  created_by_name?: string;
  transactions_count: number;
  last_transaction_date?: string;
  transactions?: CreditTransaction[];
}

export interface CreditTransaction {
  id: number;
  credit_account: number;
  transaction_type: 'debt' | 'payment' | 'adjustment';
  transaction_type_display: string;
  amount: number;
  payment_method?: 'cash' | 'card' | 'mobile' | 'bank_transfer';
  payment_method_display?: string;
  sale?: number;
  notes?: string;
  transaction_date: string;
  created_by?: number;
  created_by_name?: string;
}

export interface CreditReminder {
  id: number;
  credit_account: number;
  customer_name: string;
  customer_phone?: string;
  reminder_date: string;
  amount_due: number;
  message: string;
  status: 'pending' | 'sent' | 'acknowledged';
  status_display: string;
  sent_at?: string;
  sent_by?: number;
  sent_by_name?: string;
  created_at: string;
}

export interface CreditStatistics {
  total_accounts: number;
  active_accounts: number;
  total_debt: number;
  accounts_with_debt: number;
  payments_this_month: number;
  top_debtors: Array<{
    id: number;
    customer_name: string;
    current_balance: number;
    phone?: string;
  }>;
}

// ==================== HOOKS COMPTES CRÉDIT ====================

export function useCreditAccounts(params?: {
  status?: 'active' | 'suspended' | 'closed';
  search?: string;
  has_debt?: boolean;
}) {
  return useQuery({
    queryKey: ['credit-accounts', params],
    queryFn: async () => {
      const response = await apiService.get('/credits/accounts/', { params });
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreditAccount(id: number) {
  return useQuery({
    queryKey: ['credit-account', id],
    queryFn: async () => {
      const response = await apiService.get(`/credits/accounts/${id}/`);
      return response as CreditAccount;
    },
    enabled: !!id,
  });
}

export function useCreateCreditAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      customer_name: string;
      phone?: string;
      email?: string;
      address?: string;
      credit_limit: number;
      notes?: string;
    }) => {
      const response = await apiService.post('/credits/accounts/', data) as any;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-statistics'] });
      toast({
        title: "Succès",
        description: "Compte crédit créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création du compte",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCreditAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: Partial<{
        customer_name: string;
        phone?: string;
        email?: string;
        address?: string;
        credit_limit: number;
        status: 'active' | 'suspended' | 'closed';
        notes?: string;
      }>;
    }) => {
      const response = await apiService.patch(`/credits/accounts/${id}/`, data) as any;
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credit-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-account', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['credit-statistics'] });
      toast({
        title: "Succès",
        description: "Compte crédit mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ accountId, data }: {
      accountId: number;
      data: {
        amount: number;
        payment_method: 'cash' | 'card' | 'mobile' | 'bank_transfer';
        notes?: string;
      };
    }) => {
      const response = await apiService.post(`/credits/accounts/${accountId}/add_payment/`, data);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credit-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-account', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['credit-statistics'] });
      
      const isFullyPaid = data.new_balance === 0;
      
      toast({
        title: isFullyPaid ? "🎉 Compte soldé !" : "Succès",
        description: isFullyPaid 
          ? "Le compte n'a plus de dette" 
          : `Paiement enregistré. Nouveau solde : ${data.new_balance.toLocaleString()} FBu`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de l'enregistrement du paiement",
        variant: "destructive",
      });
    },
  });
}

export function useAddAdjustment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ accountId, data }: {
      accountId: number;
      data: {
        amount: number;
        notes: string;
      };
    }) => {
      const response = await apiService.post(`/credits/accounts/${accountId}/add_adjustment/`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credit-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['credit-account', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      toast({
        title: "Succès",
        description: "Ajustement enregistré avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.error || "Erreur lors de l'ajustement",
        variant: "destructive",
      });
    },
  });
}

// ==================== HOOKS TRANSACTIONS ====================

export function useCreditTransactions(params?: {
  account?: number;
  type?: 'debt' | 'payment' | 'adjustment';
}) {
  return useQuery({
    queryKey: ['credit-transactions', params],
    queryFn: async () => {
      const response = await apiService.get('/credits/transactions/', { params });
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== HOOKS STATISTIQUES ====================

export function useCreditStatistics() {
  return useQuery({
    queryKey: ['credit-statistics'],
    queryFn: async () => {
      const response = await apiService.get('/credits/accounts/statistics/');
      return response as CreditStatistics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== HOOKS RELANCES ====================

export function useCreditReminders(params?: {
  status?: 'pending' | 'sent' | 'acknowledged';
  account?: number;
}) {
  return useQuery({
    queryKey: ['credit-reminders', params],
    queryFn: async () => {
      const response = await apiService.get('/credits/reminders/', { params });
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      credit_account: number;
      reminder_date: string;
      amount_due: number;
      message: string;
    }) => {
      const response = await apiService.post('/credits/reminders/', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-reminders'] });
      toast({
        title: "Succès",
        description: "Relance créée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création de la relance",
        variant: "destructive",
      });
    },
  });
}

export function useMarkReminderAsSent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reminderId: number) => {
      const response = await apiService.post(`/credits/reminders/${reminderId}/mark_as_sent/`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-reminders'] });
      toast({
        title: "Succès",
        description: "Relance marquée comme envoyée",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur",
        variant: "destructive",
      });
    },
  });
}
