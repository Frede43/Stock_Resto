/**
 * Types TypeScript pour l'API Backend Django
 * Correspond aux modèles et serializers du backend
 */

// Types de base
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at?: string;
}

// Authentification
export interface User extends BaseModel {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  last_login?: string;
}

// Produits et Catégories
export interface Category extends BaseModel {
  name: string;
  type: 'boissons' | 'plats' | 'snacks';
  description?: string;
  is_active: boolean;
}

export interface Product extends BaseModel {
  name: string;
  category: number;
  category_name?: string;
  category_type?: 'boissons' | 'plats' | 'snacks';
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  description?: string;
  is_active: boolean;
  profit_margin?: number;
}

// Fournisseurs
export interface Supplier extends BaseModel {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  notes?: string;
}

// Dépenses
export interface ExpenseCategory extends BaseModel {
  name: string;
  description?: string;
  is_active: boolean;
  expenses_count?: number;
  total_amount?: number;
}

export interface Expense extends BaseModel {
  category: number;
  category_name?: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'bank_transfer' | 'check';
  receipt_number?: string;
  receipt_file?: string;
  approved_by?: number;
  approved_by_name?: string;
  notes?: string;
  expense_date: string;
  is_approved: boolean;
}

// Stocks et Mouvements
export interface StockMovement extends BaseModel {
  product: number;
  product_name?: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  user: number;
  user_name?: string;
  notes?: string;
}

// Ventes
export interface Sale extends BaseModel {
  reference?: string;
  server: number;
  server_name?: string;
  table?: number;
  table_number?: number;
  customer_name?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  discount_amount?: number;
  final_amount?: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'credit';
  credit_account?: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  items?: SaleItem[];
  items_count?: number;
  profit?: number;
  notes?: string;
}

export interface SaleItem extends BaseModel {
  sale: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  notes?: string;
}

// Ingrédients de Cuisine (nouvelles fonctionnalités)
export interface Ingredient extends BaseModel {
  nom: string;
  quantite_restante: number;
  unite: 'kg' | 'g' | 'L' | 'ml' | 'piece' | 'portion';
  unite_display?: string;
  seuil_alerte: number;
  prix_unitaire: number;
  description?: string;
  fournisseur?: number;
  fournisseur_name?: string;
  is_active: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  stock_value: number;
  date_maj: string;
}

export interface IngredientMovement extends BaseModel {
  ingredient: number;
  ingredient_name?: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'loss' | 'return';
  movement_type_display?: string;
  reason: 'purchase' | 'consumption' | 'inventory' | 'damage' | 'expiry' | 'theft' | 'correction';
  reason_display?: string;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  stock_before: number;
  stock_after: number;
  supplier?: number;
  supplier_name?: string;
  user: number;
  user_name?: string;
  notes?: string;
  reference?: string;
}

// Recettes
export interface Recipe extends BaseModel {
  plat: number;
  plat_name?: string;
  nom_recette: string;
  description?: string;
  instructions?: string;
  temps_preparation?: number;
  portions: number;
  total_cost: number;
  can_be_prepared: boolean;
  missing_ingredients?: MissingIngredient[];
  is_active: boolean;
  created_by: number;
  created_by_name?: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient extends BaseModel {
  ingredient: number;
  ingredient_name?: string;
  ingredient_stock?: number;
  ingredient_unit?: string;
  quantite_utilisee_par_plat: number;
  unite: string;
  unite_display?: string;
  cost_per_portion: number;
  is_available: boolean;
  is_optional: boolean;
  notes?: string;
}

export interface MissingIngredient {
  ingredient: string;
  needed: number;
  available: number;
  shortage: number;
  unit: string;
}

// Alertes
export interface StockAlert extends BaseModel {
  ingredient_name?: string;
  product_name?: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring';
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
}

// Rapports et Statistiques
export interface DashboardStats {
  today: {
    date: string;
    sales: number;
    revenue: number;
    pending_sales: number;
    daily_revenue: number;
    products_sold: Array<{
      product__name: string;
      product__category: string;
      quantity_sold: number;
      revenue: number;
    }>;
  };
  alerts: {
    total_unresolved: number;
    out_of_stock: number;
    low_stock: number;
  };
  quick_stats: {
    active_products: number;
    total_categories: number;
    total_products: number;
    active_alerts: number;
  };
  // Propriétés additionnelles pour le dashboard
  today_sales?: number;
  sales_change?: string;
  sales_change_type?: 'positive' | 'negative' | 'neutral';
  pending_orders?: number;
  orders_change?: string;
  orders_change_type?: 'positive' | 'negative' | 'neutral';
  stock_change?: string;
  occupied_tables?: number;
  total_tables?: number;
  occupancy_rate?: string;
}

// Types pour les statistiques de ventes
export interface SalesStats {
  hourly_sales?: Array<{
    hour: number;
    total_amount: number;
  }>;
  top_products?: Array<{
    product_name: string;
    quantity_sold: number;
    sales?: number;
  }>;
}

export interface KitchenDashboard {
  stats: {
    total_ingredients: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_stock_value: number;
    total_recipes: number;
    available_recipes: number;
    unavailable_recipes: number;
  };
  recent_movements: IngredientMovement[];
}

// Réponses API paginées
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Réponses d'erreur
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Types pour les requêtes
export interface CreateProductRequest {
  name: string;
  category: number;
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  description?: string;
}

export interface UpdateStockRequest {
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
}

export interface CreateSaleRequest {
  table_number?: number;
  payment_method: 'cash' | 'card' | 'mobile' | 'credit';
  credit_account?: number;
  items: {
    product: number;
    quantity: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface CreateRecipeRequest {
  plat: number;
  nom_recette: string;
  description?: string;
  instructions?: string;
  temps_preparation?: number;
  portions: number;
  ingredients: {
    ingredient: number;
    quantite_utilisee_par_plat: number;
    unite: string;
    is_optional?: boolean;
    notes?: string;
  }[];
}

// ==================== TYPES SUPPLÉMENTAIRES ====================

// Achats et Approvisionnements
export interface Supply extends BaseModel {
  supplier: number;
  supplier_name?: string;
  supply_date: string;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  notes?: string;
  items: SupplyItem[];
}

export interface SupplyItem extends BaseModel {
  supply: number;
  product: number;
  product_name?: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_price: number;
  total_price: number;
}

export interface Purchase extends BaseModel {
  supplier: number;
  supplier_name?: string;
  purchase_date: string;
  total_amount: number;
  status: 'pending' | 'received' | 'cancelled';
  notes?: string;
  items: PurchaseItem[];
}

export interface PurchaseItem extends BaseModel {
  purchase: number;
  product: number;
  product_name?: string;
  quantity_ordered: number;
  quantity_received?: number;
  unit_price: number;
  total_price: number;
}

// Utilisateurs et Activités
export interface User extends BaseModel {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login?: string;
  date_joined: string;
  groups?: string[];
  permissions?: string[];
}

export interface UserActivity extends BaseModel {
  user: number;
  user_name?: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// Tables et Commandes
export interface Table extends BaseModel {
  number: number;
  name?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location?: string;
  notes?: string;
  occupied_since?: string;
  server?: string;
  customer?: string;
  last_cleaned?: string;
  is_active: boolean;
}

export interface Order extends BaseModel {
  order_number: string;
  table: {
    id: number;
    number: number;
    name: string;
  };
  server: {
    id: number;
    first_name: string;
    last_name: string;
  };
  customer_name?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';
  priority: 'normal' | 'high' | 'urgent';
  total_amount: number;
  estimated_time?: number;
  notes?: string;
  items: OrderItem[];
}

export interface OrderItem extends BaseModel {
  order: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  notes?: string;
}

// Alertes système
export interface Alert extends BaseModel {
  type: 'stock' | 'sales' | 'system' | 'security' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'resolved' | 'archived';
  related_product?: Product;
  related_sale?: Sale;
  created_by?: User;
  resolved_by?: User;
  resolved_at?: string;
}

// Rapports et Analytics
export interface DailyReport extends BaseModel {
  date: string;
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_expenses: number;
  profit: number;
  top_products: Array<{
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  hourly_sales: Array<{
    hour: number;
    sales: number;
    orders: number;
    total_amount?: number;
  }>;
}

