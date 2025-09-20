import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, LogOut, Menu, X, Settings, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { NotificationCenter } from "./NotificationCenter";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps = {}) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Tableau de bord");
  const { logout, user } = useAuth();
  
  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      "/": "Tableau de bord",
      "/sales": "Point de Vente",
      "/products": "Produits",
      "/stocks": "Stock",
      "/stock-sync": "Synchronisation Stock",
      "/supplies": "Approvisionnements",
      "/sales-history": "Historique des Ventes",
      "/daily-report": "Rapport Journalier",
      "/reports": "Rapports",
      "/analytics": "Analyses",
      "/tables": "Tables",
      "/orders": "Commandes",
      "/users": "Utilisateurs",
      "/suppliers": "Fournisseurs",
      "/expenses": "Dépenses",
      "/settings": "Paramètres",
      "/alerts": "Alertes",
      "/monitoring": "Monitoring",
      "/help": "Aide",
      "/profile": "Profil",
      "/new-route": "Nouvelle Route",
    };
    
    setPageTitle(titles[path] || "Tableau de bord");
  }, [location]);


  return (
    <header className={cn("bg-card border-b shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10", className)}>
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        <h2 className="text-lg font-semibold text-foreground">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications dynamiques */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer w-full flex items-center">
                <User className="h-4 w-4 mr-2" /> Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer w-full flex items-center">
                <Settings className="h-4 w-4 mr-2" /> Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help" className="cursor-pointer w-full flex items-center">
                <HelpCircle className="h-4 w-4 mr-2" /> Aide
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer w-full flex items-center text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}