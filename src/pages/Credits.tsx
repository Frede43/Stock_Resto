import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye
} from 'lucide-react';
import {
  useCreditAccounts,
  useCreditStatistics,
  useCreateCreditAccount,
  useUpdateCreditAccount,
  useAddPayment,
  useCreditAccount,
  type CreditAccount
} from '@/hooks/use-credits';
import { useToast } from '@/hooks/use-toast';

export default function Credits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'closed'>('all');
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  
  const [newAccount, setNewAccount] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: '',
    notes: ''
  });
  
  const [payment, setPayment] = useState({
    amount: '',
    payment_method: 'cash' as 'cash' | 'card' | 'mobile' | 'bank_transfer',
    notes: ''
  });
  
  const { toast } = useToast();
  
  // Hooks
  const { data: accountsData, isLoading } = useCreditAccounts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
  });
  
  const { data: statistics } = useCreditStatistics();
  const { data: accountDetails } = useCreditAccount(selectedAccountId || 0);
  const createAccountMutation = useCreateCreditAccount();
  const updateAccountMutation = useUpdateCreditAccount();
  const addPaymentMutation = useAddPayment();
  
  const accounts = accountsData?.results || [];
  
  // 🔍 DEBUG: Logs pour comprendre pourquoi les données ne s'affichent pas
  console.log('🔍 Credits Page Debug:', {
    accountsData,
    accounts: accounts.length,
    statistics,
    isLoading,
    statusFilter,
    searchTerm
  });
  
  // Handlers
  const handleCreateAccount = () => {
    if (!newAccount.customer_name || !newAccount.credit_limit) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    createAccountMutation.mutate({
      customer_name: newAccount.customer_name,
      phone: newAccount.phone || undefined,
      email: newAccount.email || undefined,
      address: newAccount.address || undefined,
      credit_limit: parseFloat(newAccount.credit_limit),
      notes: newAccount.notes || undefined,
    }, {
      onSuccess: () => {
        setShowNewAccountDialog(false);
        setNewAccount({
          customer_name: '',
          phone: '',
          email: '',
          address: '',
          credit_limit: '',
          notes: ''
        });
      }
    });
  };
  
  const handleAddPayment = () => {
    if (!selectedAccount || !payment.amount) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(payment.amount);
    if (amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être positif",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > selectedAccount.current_balance) {
      toast({
        title: "Erreur",
        description: `Le paiement ne peut pas dépasser la dette (${selectedAccount.current_balance.toLocaleString()} FBu)`,
        variant: "destructive",
      });
      return;
    }
    
    addPaymentMutation.mutate({
      accountId: selectedAccount.id,
      data: {
        amount,
        payment_method: payment.payment_method,
        notes: payment.notes || undefined,
      }
    }, {
      onSuccess: () => {
        setShowPaymentDialog(false);
        setPayment({
          amount: '',
          payment_method: 'cash',
          notes: ''
        });
        setSelectedAccount(null);
      }
    });
  };
  
  const openPaymentDialog = (account: CreditAccount) => {
    setSelectedAccount(account);
    setShowPaymentDialog(true);
  };
  
  const openDetailsDialog = (accountId: number) => {
    setSelectedAccountId(accountId);
    setShowDetailsDialog(true);
  };
  
  const getStatusBadge = (status: string, isOverLimit: boolean) => {
    if (isOverLimit) {
      return <Badge variant="destructive">Dépassement</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default">Actif</Badge>;
      case 'suspended':
        return <Badge variant="warning">Suspendu</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Crédits</h1>
          <p className="text-muted-foreground">Suivi des comptes crédit clients</p>
        </div>
        <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau compte crédit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau compte crédit</DialogTitle>
              <DialogDescription>
                Créer un compte crédit pour un client régulier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet *</Label>
                  <Input
                    placeholder="Jean Dupont"
                    value={newAccount.customer_name}
                    onChange={(e) => setNewAccount({ ...newAccount, customer_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input
                    placeholder="+257 79 123 456"
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email (optionnel)</Label>
                  <Input
                    type="email"
                    placeholder="jean@email.com"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de crédit (FBu) *</Label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={newAccount.credit_limit}
                    onChange={(e) => setNewAccount({ ...newAccount, credit_limit: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Adresse (optionnel)</Label>
                <Input
                  placeholder="Bujumbura, Quartier Rohero"
                  value={newAccount.address}
                  onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  placeholder="Client régulier depuis 2 ans..."
                  value={newAccount.notes}
                  onChange={(e) => setNewAccount({ ...newAccount, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleCreateAccount}
                disabled={createAccountMutation.isPending}
                className="w-full"
              >
                {createAccountMutation.isPending ? "Création..." : "Créer le compte"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Statistiques */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comptes actifs</p>
                  <p className="text-2xl font-bold">{statistics.active_accounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-warning-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dette totale</p>
                  <p className="text-2xl font-bold">{statistics.total_debt.toLocaleString()} FBu</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-destructive to-destructive/80 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avec dette</p>
                  <p className="text-2xl font-bold">{statistics.accounts_with_debt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paiements ce mois</p>
                  <p className="text-2xl font-bold">{statistics.payments_this_month.toLocaleString()} FBu</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
                <SelectItem value="closed">Fermés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Liste des comptes */}
      <Card>
        <CardHeader>
          <CardTitle>Comptes Crédit</CardTitle>
          <CardDescription>
            {accounts.length} compte(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun compte crédit trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{account.customer_name}</h3>
                      {getStatusBadge(account.status, account.is_over_limit)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      📱 {account.phone || 'Pas de téléphone'}
                    </p>
                    {account.email && (
                      <p className="text-sm text-muted-foreground">
                        ✉️ {account.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Solde actuel</p>
                    <p className={`text-2xl font-bold ${account.current_balance > 0 ? 'text-warning' : 'text-success'}`}>
                      {account.current_balance.toLocaleString()} FBu
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Limite: {account.credit_limit.toLocaleString()} FBu
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Disponible: {account.available_credit.toLocaleString()} FBu
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetailsDialog(account.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    {account.current_balance > 0 && account.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(account)}
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Paiement
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog Paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Client : {selectedAccount?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className="text-2xl font-bold">
                {selectedAccount?.current_balance.toLocaleString()} FBu
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Montant du paiement (FBu) *</Label>
              <Input
                type="number"
                placeholder="20000"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mode de paiement *</Label>
              <Select
                value={payment.payment_method}
                onValueChange={(value: any) => setPayment({ ...payment, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Espèces</SelectItem>
                  <SelectItem value="card">💳 Carte bancaire</SelectItem>
                  <SelectItem value="mobile">📱 Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Paiement partiel..."
                value={payment.notes}
                onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
                rows={2}
              />
            </div>
            
            {payment.amount && selectedAccount && (
              <div className="p-4 bg-success/10 border border-success rounded-lg">
                <p className="text-sm text-muted-foreground">Nouveau solde</p>
                <p className="text-xl font-bold text-success">
                  {(selectedAccount.current_balance - parseFloat(payment.amount || '0')).toLocaleString()} FBu
                </p>
              </div>
            )}
            
            <Button
              onClick={handleAddPayment}
              disabled={addPaymentMutation.isPending}
              className="w-full"
            >
              {addPaymentMutation.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du compte crédit</DialogTitle>
          </DialogHeader>
          {accountDetails && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-semibold">{accountDetails.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-semibold">{accountDetails.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{accountDetails.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <p className="font-semibold">{accountDetails.status_display}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Limite de crédit</p>
                    <p className="font-semibold">{accountDetails.credit_limit.toLocaleString()} FBu</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Solde actuel</p>
                    <p className="font-semibold text-warning">{accountDetails.current_balance.toLocaleString()} FBu</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crédit disponible</p>
                    <p className="font-semibold text-success">{accountDetails.available_credit.toLocaleString()} FBu</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de transactions</p>
                    <p className="font-semibold">{accountDetails.transactions_count}</p>
                  </div>
                </div>
                
                {accountDetails.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="font-semibold">{accountDetails.address}</p>
                  </div>
                )}
                
                {accountDetails.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{accountDetails.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-3">
                {accountDetails.transactions && accountDetails.transactions.length > 0 ? (
                  accountDetails.transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {transaction.transaction_type === 'debt' ? (
                          <div className="h-10 w-10 bg-warning/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          </div>
                        ) : transaction.transaction_type === 'payment' ? (
                          <div className="h-10 w-10 bg-success/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-success" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                            <Edit className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{transaction.transaction_type_display}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground">{transaction.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.transaction_type === 'debt' ? 'text-warning' : 'text-success'
                        }`}>
                          {transaction.transaction_type === 'debt' ? '+' : '-'}{transaction.amount.toLocaleString()} FBu
                        </p>
                        {transaction.payment_method_display && (
                          <p className="text-xs text-muted-foreground">{transaction.payment_method_display}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune transaction</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
