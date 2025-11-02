import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Package, 
  Calendar, 
  Clock,
  Utensils,
  Wine
} from "lucide-react";

interface ProductRecord {
  id: string;
  productName: string;
  type: "boisson" | "cuisine";
  category: string;
  date: string;
  time: string;
  action: "add" | "update" | "delete";
  quantity: number;
  user: string;
  notes?: string;
}

const mockProductRecords: ProductRecord[] = [
  {
    id: "1",
    productName: "Bière Mutzig",
    type: "boisson",
    category: "Bières",
    date: "2024-08-14",
    time: "09:30",
    action: "add",
    quantity: 48,
    user: "Jean Dupont",
    notes: "Livraison hebdomadaire"
  },
  {
    id: "2",
    productName: "Whisky JW Red",
    type: "boisson",
    category: "Spiritueux",
    date: "2024-08-14",
    time: "10:15",
    action: "update",
    quantity: -2,
    user: "Marie Keza",
    notes: "Ajustement après inventaire"
  },
  {
    id: "3",
    productName: "Coca-Cola",
    type: "boisson",
    category: "Sodas",
    date: "2024-08-14",
    time: "14:45",
    action: "add",
    quantity: 24,
    user: "Jean Dupont",
    notes: "Réapprovisionnement"
  },
  {
    id: "4",
    productName: "Brochettes de bœuf",
    type: "cuisine",
    category: "Grillades",
    date: "2024-08-14",
    time: "08:45",
    action: "add",
    quantity: 30,
    user: "Pierre Nkurunziza",
    notes: "Préparation du jour"
  },
  {
    id: "5",
    productName: "Pizza Margherita",
    type: "cuisine",
    category: "Pizzas",
    date: "2024-08-14",
    time: "11:30",
    action: "update",
    quantity: -3,
    user: "Marie Keza",
    notes: "Correction après inventaire"
  },
  {
    id: "6",
    productName: "Burger Classique",
    type: "cuisine",
    category: "Burgers",
    date: "2024-08-14",
    time: "16:20",
    action: "add",
    quantity: 15,
    user: "Pierre Nkurunziza",
    notes: "Préparation pour le service du soir"
  }
];

export default function ProductRecords() {
  const [records, setRecords] = useState(mockProductRecords);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"boisson" | "cuisine">("boisson");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Filter records based on search query, type, date and action
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = record.type === selectedType;
    const matchesDate = dateFilter ? record.date === dateFilter : true;
    const matchesAction = actionFilter === "all" ? true : record.action === actionFilter;
    
    return matchesSearch && matchesType && matchesDate && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "add":
        return <Badge variant="success">Ajout</Badge>;
      case "update":
        return <Badge variant="warning">Modification</Badge>;
      case "delete":
        return <Badge variant="destructive">Suppression</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Enregistrements des Produits
              </h1>
              <p className="text-muted-foreground">
                Historique des mouvements et modifications de produits
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Rechercher un produit, utilisateur..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {/* Type Filter */}
                  <div className="flex gap-2">
                    <Button
                      variant={selectedType === "boisson" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType("boisson")}
                      className="gap-2"
                    >
                      <Wine className="h-4 w-4" />
                      Boissons
                    </Button>
                    <Button
                      variant={selectedType === "cuisine" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType("cuisine")}
                      className="gap-2"
                    >
                      <Utensils className="h-4 w-4" />
                      Cuisine
                    </Button>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-auto"
                    />
                    {dateFilter && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDateFilter("")}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    )}
                  </div>

                  {/* Action Filter */}
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrer par action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      <SelectItem value="add">Ajout</SelectItem>
                      <SelectItem value="update">Modification</SelectItem>
                      <SelectItem value="delete">Suppression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
              <CardDescription>
                {filteredRecords.length} enregistrement(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Date & Heure</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.productName}</TableCell>
                        <TableCell>{record.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{record.date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{record.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(record.action)}</TableCell>
                        <TableCell className={record.quantity >= 0 ? "text-success" : "text-destructive"}>
                          {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                        </TableCell>
                        <TableCell>{record.user}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Aucun enregistrement trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
  );
}