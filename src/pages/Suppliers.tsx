import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  MapPin,
  Search,
  Loader2,
  Package,
  TrendingUp
} from "lucide-react";
import { useSuppliers, useCreateSupplier } from "@/hooks/use-api";
import { Supplier } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

// Interface pour l'affichage des fournisseurs (mapping depuis l'API)
interface SupplierDisplay {
  id: number;
  name: string;
  supplier_type: string;
  category: string;
  contact: {
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  };
  status: "active" | "inactive";
  lastOrder: string;
}

// Types de fournisseurs
const supplierTypes = [
  { value: "beverages", label: "Boissons", icon: "🍺" },
  { value: "food", label: "Produits alimentaires", icon: "🍽️" },
  { value: "ingredients", label: "Ingrédients pour recettes", icon: "🧄" },
  { value: "equipment", label: "Équipements", icon: "🔧" },
  { value: "cleaning", label: "Produits d'entretien", icon: "🧽" },
  { value: "other", label: "Autres", icon: "📦" },
];

// Fonction pour mapper les fournisseurs de l'API vers l'affichage
const mapSupplierToDisplay = (supplier: any): SupplierDisplay => ({
  id: supplier.id,
  name: supplier.name,
  supplier_type: supplier.supplier_type || "other",
  category: supplierTypes.find(t => t.value === supplier.supplier_type)?.label || "Autres",
  contact: {
    email: supplier.email || "",
    phone: supplier.phone || "",
    address: supplier.address || "",
    contactPerson: supplier.contact_person || ""
  },
  status: supplier.is_active ? "active" : "inactive",
  lastOrder: supplier.updated_at || supplier.created_at
});

export default function Suppliers() {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDisplay | null>(null);
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { toast } = useToast();

  // Utiliser l'API pour récupérer les fournisseurs
  const { 
    data: suppliersData, 
    isLoading, 
    error,
    refetch 
  } = useSuppliers({ 
    search: searchTerm || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "active"
  });

  // Hook pour créer un fournisseur
  const createSupplierMutation = useCreateSupplier();

  // Mapper les données de l'API
  const suppliers: SupplierDisplay[] = Array.isArray((suppliersData as any)?.results)
    ? (suppliersData as any).results.map(mapSupplierToDisplay)
    : [];

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    supplier_type: "other",
    email: "",
    phone: "",
    address: "",
    contact_person: ""
  });

  // Filtrer les fournisseurs selon la recherche et le statut
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: SupplierDisplay["status"]) => {
    switch (status) {
      case "active":
        return { variant: "success" as const, label: "Actif" };
      case "inactive":
        return { variant: "secondary" as const, label: "Inactif" };
    }
  };

  const createSupplier = async () => {
    if (!newSupplier.name || !newSupplier.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et l'email",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSupplierMutation.mutateAsync({
        name: newSupplier.name,
        supplier_type: newSupplier.supplier_type,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
        contact_person: newSupplier.contact_person,
        is_active: true
      } as any);

      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
        variant: "default",
      });

      setShowNewSupplierDialog(false);
      setNewSupplier({
        name: "",
        supplier_type: "other",
        email: "",
        phone: "",
        address: "",
        contact_person: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du fournisseur",
        variant: "destructive",
      });
    }
  };

  return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fournisseurs</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Gérez vos fournisseurs et leurs informations
                </p>
              </div>
              <Dialog open={showNewSupplierDialog} onOpenChange={setShowNewSupplierDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Nouveau fournisseur</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Nouveau fournisseur</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau fournisseur à votre base de données.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier(prev => ({...prev, name: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de fournisseur *</Label>
                      <Select
                        value={newSupplier.supplier_type}
                        onValueChange={(value) => setNewSupplier(prev => ({...prev, supplier_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier(prev => ({...prev, email: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier(prev => ({...prev, phone: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier(prev => ({...prev, address: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Personne de contact</Label>
                      <Input
                        value={newSupplier.contact_person}
                        onChange={(e) => setNewSupplier(prev => ({...prev, contact_person: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewSupplierDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={createSupplier} disabled={createSupplierMutation.isPending}>
                      {createSupplierMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Recherche et filtres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher un fournisseur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Stats */}
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Total fournisseurs</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Total fournisseurs</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {isLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : suppliers.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Actifs</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Actifs</p>
                    <p className="text-xl md:text-2xl font-bold text-success">
                      {isLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : suppliers.filter(s => s.status === "active").length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Inactifs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Inactifs</p>
                    <p className="text-xl md:text-2xl font-bold text-warning">
                      {isLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : suppliers.filter(s => s.status === "inactive").length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium">Résultats filtrés</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">Résultats filtrés</p>
                    <p className="text-lg md:text-xl font-bold text-secondary">
                      {isLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : filteredSuppliers.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suppliers List */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des fournisseurs</CardTitle>
                <CardDescription>
                  Gérez vos fournisseurs et leurs informations de contact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">Erreur lors du chargement des fournisseurs</p>
                    <Button onClick={() => refetch()} variant="outline">
                      Réessayer
                    </Button>
                  </div>
                )}
                
                {isLoading && (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Chargement des fournisseurs...</p>
                  </div>
                )}
                
                {!isLoading && !error && (
                  <div className="space-y-4">
                    {filteredSuppliers.length === 0 ? (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucun fournisseur trouvé</p>
                      </div>
                    ) : (
                      filteredSuppliers.map((supplier) => {
                        const statusInfo = getStatusInfo(supplier.status);
                        
                        return (
                          <div key={supplier.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 border rounded-lg gap-3 md:gap-4">
                            <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto min-w-0">
                              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Truck className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm md:text-base truncate">{supplier.name}</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                                  {supplier.contact.email && (
                                    <div className="flex items-center gap-1 truncate">
                                      <Mail className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{supplier.contact.email}</span>
                                    </div>
                                  )}
                                  {supplier.contact.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 flex-shrink-0" />
                                      {supplier.contact.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                              <Badge variant={statusInfo.variant} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Edit className="h-4 w-4" />
                                <span className="ml-1 sm:hidden">Modifier</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                                disabled
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="ml-1 sm:hidden">Supprimer</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
  );
}
