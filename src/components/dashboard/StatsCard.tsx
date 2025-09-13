import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/stable-card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral" | "warning";
  icon: LucideIcon;
  description?: string;
  gradient?: string;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  gradient = "from-primary to-primary-glow"
}: StatsCardProps) {
  const getChangeVariant = (type: typeof changeType) => {
    switch (type) {
      case "positive": return "success" as const;
      case "negative": return "destructive" as const;
      case "warning": return "warning" as const;
      default: return "secondary" as const;
    }
  };
  
  const changeVariant = getChangeVariant(changeType);

  return (
    <Card className="overflow-hidden relative group">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300",
        gradient
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        
        <div className="flex items-center gap-2">
          {change && (
            <Badge variant={changeVariant} className="text-xs">
              {change}
            </Badge>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});