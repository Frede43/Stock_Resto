import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Menu, Settings, HelpCircle, Search, Moon, Sun } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps = {}) {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("Tableau de bord");
  const [isDark, setIsDark] = useState(false);
  const { logout, user } = useAuth();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      "/kitchen": "Cuisine",
    };
    
    setPageTitle(titles[path] || "Tableau de bord");
  }, [location]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className={cn(
      "sticky top-0 flex w-full bg-card border-b border-border z-40 transition-colors",
      className
    )}>
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 sm:gap-4 lg:justify-normal lg:px-0 lg:py-4">
          {/* Toggle Button */}
          <button
            className="flex items-center justify-center w-10 h-10 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors lg:h-11 lg:w-11"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page Title */}
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">
            {pageTitle}
          </h1>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md ml-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher... (Ctrl+K)"
                className="pl-10 pr-4 bg-muted/50 border-border focus:bg-background"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title="Changer le thème"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || user?.role || 'Role'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full flex items-center">
                    <User className="w-4 h-4 mr-2" /> Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer w-full flex items-center">
                    <Settings className="w-4 h-4 mr-2" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help" className="cursor-pointer w-full flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" /> Aide
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout} 
                  className="cursor-pointer w-full flex items-center text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
