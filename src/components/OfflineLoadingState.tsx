// Composant de chargement pour les pages offline
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OfflineLoadingStateProps {
  message?: string;
}

export function OfflineLoadingState({ message = "Chargement des données en cache..." }: OfflineLoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-3/4"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Veuillez patienter...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
