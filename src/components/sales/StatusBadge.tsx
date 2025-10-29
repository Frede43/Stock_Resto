import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, CheckCircle, Utensils, DollarSign, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }> = {
    pending: {
      label: "En attente",
      color: "text-orange-700",
      bgColor: "bg-orange-100 hover:bg-orange-200 border-orange-300",
      icon: <Clock className="h-3 w-3" />
    },
    preparing: {
      label: "En préparation",
      color: "text-blue-700",
      bgColor: "bg-blue-100 hover:bg-blue-200 border-blue-300",
      icon: <ChefHat className="h-3 w-3" />
    },
    ready: {
      label: "Prêt",
      color: "text-purple-700",
      bgColor: "bg-purple-100 hover:bg-purple-200 border-purple-300",
      icon: <CheckCircle className="h-3 w-3" />
    },
    served: {
      label: "Servi",
      color: "text-cyan-700",
      bgColor: "bg-cyan-100 hover:bg-cyan-200 border-cyan-300",
      icon: <Utensils className="h-3 w-3" />
    },
    paid: {
      label: "Payé",
      color: "text-green-700",
      bgColor: "bg-green-100 hover:bg-green-200 border-green-300",
      icon: <DollarSign className="h-3 w-3" />
    },
    completed: {
      label: "Terminée",
      color: "text-green-700",
      bgColor: "bg-green-100 hover:bg-green-200 border-green-300",
      icon: <CheckCircle className="h-3 w-3" />
    },
    cancelled: {
      label: "Annulée",
      color: "text-red-700",
      bgColor: "bg-red-100 hover:bg-red-200 border-red-300",
      icon: <XCircle className="h-3 w-3" />
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge 
      variant="outline" 
      className={`${config.bgColor} ${config.color} font-semibold border ${className} flex items-center gap-1.5 px-3 py-1`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
