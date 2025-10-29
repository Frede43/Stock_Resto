import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import {
  Menu,
  X,
  DollarSign,
  ShoppingCart,
  Table,
  ClipboardList,
  User,
  LogOut,
  Home,
  ChevronDown,
  ChevronRight,
  Wallet,
  History,
  Settings
} from "lucide-react";

interface CashierMenuItem {
  href: string;
  icon: any;
  label: string;
  color: string;
}

interface CashierMenuSection {
  title: string;
  icon: any;
  items: CashierMenuItem[];
}

// Menus organisés par sections pour le caissier
const cashierMenuSections: CashierMenuSection[] = [
  {
    title: "Gestion",
    icon: Wallet,
    items: [
      { 
        href: "/sales", 
        icon: DollarSign, 
        label: "Vente", 
        color: "text-green-600"
      }
    ]
  },
  {
    title: "Finance",
    icon: History,
    items: [
      { 
        href: "/sales-history", 
        icon: History, 
        label: "Historique vente", 
        color: "text-blue-600"
      }
    ]
  },
  {
    title: "Opération",
    icon: Settings,
    items: [
      { 
        href: "/tables", 
        icon: Table, 
        label: "Table", 
        color: "text-purple-600"
      },
      { 
        href: "/orders", 
        icon: ClipboardList, 
        label: "Commande", 
        color: "text-orange-600"
      }
    ]
  }
];

interface CashierSidebarProps {
  className?: string;
}

export function CashierSidebar({ className }: CashierSidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Gestion", "Finance", "Opération"]);
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col bg-gradient-to-b from-primary to-primary-dark text-primary-foreground transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-foreground/20">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold">💰 Caissier</h2>
              <p className="text-xs text-primary-foreground/70">Point de Vente</p>
            </div>
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

        {/* Informations utilisateur */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-primary-foreground/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {user.first_name} {user.last_name}
                </p>
                <Badge variant="secondary" className="text-xs">
                  💰 Caissier
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation avec sous-menus */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {cashierMenuSections.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const SectionIcon = section.icon;

            return (
              <div key={section.title} className="space-y-1">
                {/* Titre de section */}
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-primary-foreground/90 hover:bg-primary-foreground/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Items du sous-menu */}
                {(isExpanded || isCollapsed) && (
                  <div className={cn("space-y-1", !isCollapsed && "pl-6")}>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href;
                      const Icon = item.icon;

                      const menuItem = (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-primary-foreground/20 text-primary-foreground font-medium"
                              : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", item.color)} />
                          {!isCollapsed && (
                            <span className="text-sm">{item.label}</span>
                          )}
                        </Link>
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              {menuItem}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div>
                                <p className="font-medium">{section.title}</p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return menuItem;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer avec déconnexion */}
        <div className="p-4 border-t border-primary-foreground/20">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "w-full justify-start gap-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Déconnexion"}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
