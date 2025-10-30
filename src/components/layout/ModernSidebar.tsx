import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/context/SidebarContext";
import { useAccessibleMenus } from "@/hooks/use-permissions";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  Settings,
  Home,
  Truck,
  AlertTriangle,
  User,
  RefreshCw,
  History,
  Calendar,
  PieChart,
  Table,
  ClipboardList,
  Receipt,
  Bell,
  Monitor,
  HelpCircle,
  ChevronDown,
  ChefHat,
  Sparkles,
  Utensils,
  X
} from "lucide-react";

interface MenuItem {
  href: string;
  icon: any;
  label: string;
  permissionKey?: string;
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
      { href: "/", icon: Home, label: "Accueil", permissionKey: "dashboard" },
      { href: "/profile", icon: User, label: "Mon Profil", permissionKey: "profile" },
    ]
  },
  {
    label: "Gestion",
    defaultOpen: true,
    items: [
      { href: "/products", icon: Package, label: "Produits", permissionKey: "products" },
      { href: "/sales", icon: Sparkles, label: "Ventes", permissionKey: "sales" },
      { href: "/kitchen", icon: Utensils, label: "Cuisine", permissionKey: "kitchen" },
    ]
  },
  {
    label: "Stocks",
    defaultOpen: true,
    items: [
      { href: "/stocks", icon: Boxes, label: "Inventaires", permissionKey: "stocks" },
      { href: "/stock-sync", icon: RefreshCw, label: "Synchronisation", permissionKey: "stock-sync" },
      { href: "/supplies", icon: Truck, label: "Approvisionnements", permissionKey: "supplies" },
    ]
  },
  {
    label: "Finances",
    defaultOpen: false,
    items: [
      { href: "/sales-history", icon: History, label: "Historique Ventes", permissionKey: "sales-history" },
      { href: "/daily-report", icon: Calendar, label: "Rapport Quotidien", permissionKey: "daily-report" },
      { href: "/reports", icon: BarChart3, label: "Rapports", permissionKey: "reports" },
      { href: "/analytics", icon: PieChart, label: "Analyses", permissionKey: "analytics" },
      { href: "/expenses", icon: Receipt, label: "Dépenses", permissionKey: "expenses" },
    ]
  },
  {
    label: "Opérations",
    defaultOpen: false,
    items: [
      { href: "/tables", icon: Table, label: "Tables", permissionKey: "tables" },
      { href: "/orders", icon: ClipboardList, label: "Commandes", permissionKey: "orders" },
    ]
  },
  {
    label: "Administration",
    defaultOpen: false,
    items: [
      { href: "/users", icon: Users, label: "Utilisateurs", permissionKey: "users" },
      { href: "/suppliers", icon: Truck, label: "Fournisseurs", permissionKey: "suppliers" },
    ]
  },
  {
    label: "Système",
    defaultOpen: false,
    items: [
      { href: "/settings", icon: Settings, label: "Paramètres", permissionKey: "settings" },
      { href: "/alerts", icon: AlertTriangle, label: "Alertes", permissionKey: "alerts" },
      { href: "/monitoring", icon: Monitor, label: "Monitoring", permissionKey: "monitoring" },
      { href: "/help", icon: HelpCircle, label: "Aide", permissionKey: "help" },
    ]
  },
];

export function Sidebar() {
  const location = useLocation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();
  const { accessibleMenus } = useAccessibleMenus();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Initialize open categories
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menuCategories.forEach(category => {
      initial[category.label] = category.defaultOpen ?? false;
    });
    setOpenCategories(initial);
  }, []);

  const toggleCategory = (label: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const canAccessMenu = (permissionKey?: string) => {
    if (!permissionKey) return true;
    return accessibleMenus.includes(permissionKey);
  };

  const shouldShow = isExpanded || isHovered;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 flex flex-col",
          shouldShow ? "w-64" : "w-20",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {shouldShow ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Harry's Grill</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={closeMobileSidebar}
              >
                <X className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {menuCategories.map((category) => {
            const visibleItems = category.items.filter(item => canAccessMenu(item.permissionKey));
            if (visibleItems.length === 0) return null;

            return (
              <div key={category.label}>
                {/* Category Header */}
                {shouldShow && (
                  <button
                    onClick={() => toggleCategory(category.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        openCategories[category.label] ? "rotate-180" : ""
                      )}
                    />
                  </button>
                )}

                {/* Category Items */}
                {(openCategories[category.label] || !shouldShow) && (
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => isMobileOpen && closeMobileSidebar()}
                          className={cn(
                            "menu-item group",
                            active ? "menu-item-active" : "menu-item-inactive"
                          )}
                          title={!shouldShow ? item.label : undefined}
                        >
                          <Icon className={cn("menu-item-icon flex-shrink-0", active && "text-primary")} />
                          {shouldShow && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - Version */}
        {shouldShow && (
          <div className="p-4 border-t border-border bg-card flex-shrink-0">
            <div className="text-xs text-muted-foreground text-center">
              <p className="font-semibold">Version 2.0.0</p>
              <p>© 2025 Harry's Grill</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
