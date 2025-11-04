import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePermissions } from "@/hooks/use-permissions";

// Types
interface ExpenseCategory {
  id: number;
  name: string;
  category_type: string;
  description?: string;
  budget_monthly?: number;
  is_active: boolean;
  requires_approval: boolean;
  approval_threshold?: number;
  expenses_count?: number;
  total_amount?: number;
}

interface Expense {
  id: number;
  category: number;
  category_name?: string;
  description: string;
  amount: number;
  payment_method: string;
  payment_reference?: string;
  receipt_number?: string;
  receipt_file?: string;
  supplier?: number;
  supplier_name?: string;
  expense_date: string;
  due_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  is_recurring: boolean;
  recurrence_period?: string;
  is_approved: boolean;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

interface ExpenseStats {
  total_expenses: number;
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  count_pending: number;
  count_approved: number;
  count_rejected: number;
  by_category: Array<{ category__name: string; total: number; count: number }>;
  by_payment_method: Array<{ payment_method: string; total: number; count: number }>;
  monthly_trend: Array<{ month: string; total: number }>;
}

const Expenses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  // Vérifier si l'utilisateur est admin (peut approuver/rejeter)
  const canManageExpenses = hasPermission('expenses_manage');
  
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Formulaire nouvelle dépense
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    payment_reference: '',
    receipt_number: '',
    supplier: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    notes: '',
    is_recurring: false,
    recurrence_period: '',
  });
  
  // Queries
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      return await apiService.get<any>('/expenses/categories/');
    },
  });
  
  // Extraire le tableau de catégories (gérer pagination DRF)
  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : (categoriesData?.results || []);
  
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', statusFilter, categoryFilter, startDate, endDate, canManageExpenses],
    queryFn: async () => {
      let url = '/expenses/expenses/';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      // Si l'utilisateur n'est pas admin, afficher seulement ses dépenses
      if (!canManageExpenses) {
        params.append('my_expenses', 'true');
      }
      
      if (params.toString()) url += `?${params.toString()}`;
      
      return await apiService.get<any>(url);
    },
  });
  
  // Extraire le tableau d'expenses (gérer pagination DRF)
  const expenses = Array.isArray(expensesData) 
    ? expensesData 
    : (expensesData?.results || []);
  
  const { data: stats } = useQuery<ExpenseStats>({
    queryKey: ['expense-stats', startDate, endDate],
    queryFn: async () => {
      let url = '/expenses/expenses/stats/';
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      return await apiService.get<ExpenseStats>(url);
    },
  });
  
  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiService.post<Expense>('/expenses/expenses/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: 'Dépense créée',
        description: 'La dépense a été enregistrée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de créer la dépense.',
        variant: 'destructive',
      });
    },
  });
  
  const approveExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiService.post<any>(`/expenses/expenses/${id}/approve/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      setShowApprovalDialog(false);
      setSelectedExpense(null);
      toast({
        title: 'Dépense approuvée',
        description: 'La dépense a été approuvée avec succès.',
      });
    },
  });
  
  const rejectExpenseMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiService.post<any>(`/expenses/expenses/${id}/reject/`, {
        action: 'reject',
        rejection_reason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      setShowApprovalDialog(false);
      setSelectedExpense(null);
      toast({
        title: 'Dépense rejetée',
        description: 'La dépense a été rejetée.',
      });
    },
  });
  
  // Filtrer les dépenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);
  
  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      category: parseInt(formData.category),
      supplier: formData.supplier ? parseInt(formData.supplier) : null,
      due_date: formData.due_date || null, // Envoyer null si vide
    });
  };
  
  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      payment_method: 'cash',
      payment_reference: '',
      receipt_number: '',
      supplier: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      notes: '',
      is_recurring: false,
      recurrence_period: '',
    });
  };
  
  const handleApprove = (expense: Expense) => {
    approveExpenseMutation.mutate(expense.id);
  };
  
  const handleReject = (expense: Expense, reason: string) => {
    rejectExpenseMutation.mutate({ id: expense.id, reason });
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approuvée' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejetée' },
      paid: { variant: 'default', icon: DollarSign, label: 'Payée' },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' BIF';
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Dépenses</h1>
          <p className="text-muted-foreground">
            Suivez et gérez toutes les dépenses de l'établissement
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enregistrer une Dépense</DialogTitle>
              <DialogDescription>
                Remplissez les informations de la dépense
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (BIF) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Ex: Achat de fournitures..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Méthode de paiement *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_reference">Référence de paiement</Label>
                  <Input
                    id="payment_reference"
                    value={formData.payment_reference}
                    onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                    placeholder="N° transaction/chèque..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Date de la dépense *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="receipt_number">N° de reçu</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    placeholder="N° du reçu/facture..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createExpenseMutation.isPending}>
                  {createExpenseMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.total_expenses) : '0 BIF'}
            </div>
            <p className="text-xs text-muted-foreground">
              Toutes les dépenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.total_pending) : '0 BIF'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.count_pending || 0} dépense(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.total_approved) : '0 BIF'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.count_approved || 0} dépense(s)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.total_rejected) : '0 BIF'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.count_rejected || 0} dépense(s)
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="rejected">Rejetées</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Dépenses ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée par</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucune dépense trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.receipt_number && (
                            <div className="text-xs text-muted-foreground">
                              Reçu: {expense.receipt_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category_name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {expense.payment_method === 'cash' && 'Espèces'}
                        {expense.payment_method === 'card' && 'Carte'}
                        {expense.payment_method === 'mobile' && 'Mobile Money'}
                        {expense.payment_method === 'bank_transfer' && 'Virement'}
                        {expense.payment_method === 'check' && 'Chèque'}
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell className="text-sm">
                        {expense.created_by_name}
                      </TableCell>
                      <TableCell>
                        {canManageExpenses && expense.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(expense)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowApprovalDialog(true);
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                        {!canManageExpenses && expense.status === 'pending' && (
                          <Badge variant="secondary">En attente d'approbation</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog Rejet */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la dépense</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const reason = formData.get('reason') as string;
              if (selectedExpense) {
                handleReject(selectedExpense, reason);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du rejet *</Label>
              <Textarea
                id="reason"
                name="reason"
                required
                placeholder="Expliquez pourquoi cette dépense est rejetée..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="destructive">
                Rejeter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
