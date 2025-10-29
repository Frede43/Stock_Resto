import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAccessibleMenus, useCanAccessMenu, useUserPermissions } from "@/hooks/use-permissions";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  Home,
  TrendingUp,
  Truck,
  AlertTriangle,
  User,
  RefreshCw,
  History,
  Calendar,
  PieChart,
  Table,
  ClipboardList,
  Building2,
  Receipt,
  Bell,
  Monitor,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChefHat,
  Sparkles,
  Utensils
} from "lucide-react";

interface MenuItem {
  href: string;
  icon: any;
  label: string;
  color: string;
  category?: string;
  permissionKey?: string; // Clé pour vérifier les permissions
}

interface MenuCategory {
  label: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const menuCategories: MenuCategory[] = [
  {
    label: "Principal",
    defaultOpen: true,
    items: [
      { href: "/", icon: Home, label: "Accueil", color: "text-accent", permissionKey: "dashboard" },
      { href: "/profile", icon: User, label: "Mon Profil", color: "text-secondary", permissionKey: "profile" },
    ]
  },
  {
    label: "Gestion",
    defaultOpen: true,
    items: [
      { href: "/products", icon: Package, label: "Produits", color: "text-secondary", permissionKey: "products" },
      { href: "/sales", icon: Sparkles, label: "Ventes", color: "text-blue-500", permissionKey: "sales" },
      { href: "/kitchen", icon: Utensils, label: "Cuisine", color: "text-green-500", permissionKey: "kitchen" },
    ]
  },
  {
    label: "Stocks",
    defaultOpen: true,
    items: [
      { href: "/stocks", icon: Boxes, label: "Inventaires", color: "text-warning", permissionKey: "stocks" },
      { href: "/stock-sync", icon: RefreshCw, label: "Synchronisation", color: "text-primary", permissionKey: "stock-sync" },
      { href: "/supplies", icon: Truck, label: "Approvisionnements", color: "text-success", permissionKey: "supplies" },
    ]
  },
  {
    label: "Finances",
    defaultOpen: false,
    items: [
      { href: "/sales-history", icon: History, label: "Historique Ventes", color: "text-primary", permissionKey: "sales-history" },
      { href: "/daily-report", icon: Calendar, label: "Rapport Quotidien", color: "text-warning", permissionKey: "daily-report" },
      { href: "/reports", icon: BarChart3, label: "Rapports", color: "text-primary-glow", permissionKey: "reports" },
      { href: "/analytics", icon: PieChart, label: "Analyses", color: "text-accent", permissionKey: "analytics" },
      { href: "/expenses", icon: Receipt, label: "Dépenses", color: "text-destructive", permissionKey: "expenses" },
    ]
  },
  {
    label: "Opérations",
    defaultOpen: false,
    items: [
      { href: "/tables", icon: Table, label: "Tables", color: "text-success", permissionKey: "tables" },
      { href: "/orders", icon: ClipboardList, label: "Commandes", color: "text-warning", permissionKey: "orders" },
    ]
  },
  {
    label: "Administration",
    defaultOpen: false,
    items: [
      { href: "/users", icon: Users, label: "Utilisateurs", color: "text-secondary", permissionKey: "users" },
      { href: "/suppliers", icon: Building2, label: "Fournisseurs", color: "text-primary", permissionKey: "suppliers" },
    ]
  },
  {
    label: "Système",
    defaultOpen: false,
    items: [
      { href: "/alerts", icon: Bell, label: "Alertes", color: "text-destructive", permissionKey: "alerts" },
      { href: "/monitoring", icon: Monitor, label: "Surveillance", color: "text-warning", permissionKey: "monitoring" },
      { href: "/settings", icon: Settings, label: "Paramètres", color: "text-muted-foreground", permissionKey: "settings" },
      { href: "/help", icon: HelpCircle, label: "Aide", color: "text-success", permissionKey: "help" },
    ]
  }
];

interface SidebarProps {
  className?: string;
}

// Composant pour un élément de menu avec vérification des permissions
function MenuItemComponent({ item, isCollapsed, isActive }: {
  item: MenuItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  const canAccess = useCanAccessMenu(item.permissionKey as any);

  if (!canAccess) {
    return null; // Ne pas afficher l'élément si l'utilisateur n'a pas les permissions
  }

  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-lg transition-colors hover:bg-primary-foreground/10",
              isActive && "bg-primary-foreground/20"
            )}
          >
            <Icon className={cn("h-5 w-5", item.color)} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-primary-foreground/10",
        isActive && "bg-primary-foreground/20"
      )}
    >
      <Icon className={cn("h-5 w-5", item.color)} />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ className }: SidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    menuCategories.reduce((acc, category) => ({
      ...acc,
      [category.label]: category.defaultOpen || false
    }), {})
  );
  const location = useLocation();
  const { accessibleMenus, isLoading, userRole } = useAccessibleMenus();

  const toggleCategory = (categoryLabel: string) => {
    if (isCollapsed) return;
    setOpenCategories(prev => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel]
    }));
  };

  // Filtrer les catégories pour ne montrer que celles avec des éléments accessibles
  const getFilteredCategories = () => {
    return menuCategories.map(category => ({
      ...category,
      items: category.items.filter(item =>
        !item.permissionKey || accessibleMenus.includes(item.permissionKey)
      )
    })).filter(category => category.items.length > 0);
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col bg-gradient-to-b from-primary to-primary-glow text-primary-foreground transition-all duration-300 sticky top-0 h-screen",
        isCollapsed ? "w-16" : "w-64 md:w-64",
        "w-full md:w-auto", // Mobile: pleine largeur, Desktop: largeur fixe
        className
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
            Harry's Grill Bar-Resto
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-primary-foreground/70 text-sm">
            Chargement...
          </div>
        ) : (
          <>
            {/* Affichage du rôle utilisateur */}
            {!isCollapsed && userRole && (
              <div className="mb-4 p-2 bg-primary-foreground/10 rounded-lg">
                <p className="text-xs text-primary-foreground/70">Connecté en tant que:</p>
                <p className="text-sm font-medium capitalize">{userRole}</p>
              </div>
            )}

            {getFilteredCategories().map((category) => (
          <div key={category.label} className="space-y-1">
            {/* Category Header */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                onClick={() => toggleCategory(category.label)}
                className="w-full justify-between text-primary-foreground/70 hover:bg-primary-foreground/10 text-xs font-medium py-2 px-3"
              >
                <span>{category.label}</span>
                {openCategories[category.label] ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            {/* Category Items */}
            {(isCollapsed || openCategories[category.label]) && (
              <div className={cn("space-y-1", !isCollapsed && "ml-2")}>
                {category.items.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <MenuItemComponent
                      key={item.href}
                      item={item}
                      isCollapsed={isCollapsed}
                      isActive={isActive}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-foreground/20">
        <div className={cn("text-xs text-primary-foreground/70", isCollapsed && "text-center")}>
          {!isCollapsed ? "© 2025 Harry's Grill Bar-Resto" : "BSW"}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}