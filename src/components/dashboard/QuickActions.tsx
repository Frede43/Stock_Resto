import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart, Package, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Nouvelle vente",
      icon: ShoppingCart,
      variant: "accent" as const,
      href: "/sales",
      onClick: () => navigate("/sales")
    },
    {
      label: "Ajouter produit",
      icon: Package,
      variant: "secondary" as const,
      href: "/products",
      onClick: () => navigate("/products")
    },
    {
      label: "Rapport quotidien",
      icon: FileText,
      variant: "premium" as const,
      href: "/reports/daily",
      onClick: () => navigate("/reports/daily")
    },
    {
      label: "Réapprovisionnement",
      icon: Plus,
      variant: "success" as const,
      href: "/supplies",
      onClick: () => navigate("/supplies")
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-20 flex-col gap-2 group cursor-pointer"
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}