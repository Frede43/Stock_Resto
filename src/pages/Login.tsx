import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, user, isLoading } = useAuth();
  
  // Rediriger vers le tableau de bord si déjà connecté
  useEffect(() => {
    if (user && user.isLoggedIn) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Utiliser la fonction login du hook useAuth
    const success = await login(username, password);
    
    // CORRECTION CROSS-BROWSER: Laisser le hook useAuth gérer la redirection
    // Ne pas faire de redirection manuelle ici pour éviter les conflits
    if (success) {
      console.log('🔑 Login.tsx - Connexion réussie, redirection gérée par useAuth');
      // La redirection est maintenant gérée dans use-auth.tsx avec retry logic
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-glow">
            <Lock className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Harry's Grill Bar
          </h1>
          <p className="text-primary-foreground/80">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              Connexion
            </CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder au système
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Votre nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-sm text-muted-foreground">Se souvenir</span>
                </label>
                <Button variant="link" className="px-0 text-sm">
                  Mot de passe oublié ?
                </Button>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="premium" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>
            </form>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-primary-foreground/70">
            © 2024 Harry's Grill Bar. Système de gestion professionnel.
          </p>
        </div>
      </div>
    </div>
  );
}