import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/stable-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  BarChart3,
  Settings,
  Package,
  Database,
  Shield,
  Monitor,
  Crown,
  Activity,
  Bell,
  ArrowRight,
  Zap
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('👑 AdminDashboard - User:', user);
  console.log('👑 AdminDashboard - Role:', user?.role);

  // Actions rapides pour admin avec priorités
  const adminQuickActions = [
    {
      title: "Gestion Utilisateurs",
      description: "Créer et gérer les comptes utilisateurs",
      icon: Users,
      href: "/users",
      color: "from-blue-500 to-blue-600",
      priority: "high",
      badge: "Essentiel"
    },
    {
      title: "Gestion des Stocks",
      description: "Inventaire et approvisionnements",
      icon: Package,
      href: "/stocks",
      color: "from-orange-500 to-orange-600",
      priority: "high",
      badge: "Critique"
    },
    {
      title: "Rapport Quotidien",
      description: "Consulter les rapports journaliers",
      icon: BarChart3,
      href: "/daily-report",
      color: "from-emerald-500 to-emerald-600",
      priority: "high",
      badge: "Quotidien"
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* En-tête Admin Amélioré */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl opacity-10"></div>
            <div className="relative text-center py-12 px-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Administration
                </h1>
              </div>
              <p className="text-xl text-slate-600 mb-4">
                Bienvenue dans le centre de contrôle de Bar Stock Wise
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span>Système opérationnel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <span>Notifications actives</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Performances optimales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides Admin Redesignées */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Outils d'Administration</h2>
                <p className="text-slate-600">Accès rapide aux fonctions principales</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Monitor className="h-4 w-4" />
                État du système
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {adminQuickActions.map((action) => (
                <Card 
                  key={action.href} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-md overflow-hidden"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`h-2 bg-gradient-to-r ${action.color}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      {action.badge && (
                        <Badge variant={action.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-slate-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                        {action.priority === 'high' ? 'Priorité élevée' : 'Fonction avancée'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Informations et Conseils */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Interface Optimisée</h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Cette interface d'administration a été conçue pour vous offrir un accès rapide et intuitif à tous les outils de gestion de votre restaurant.
                    </p>
                    <Button variant="link" className="text-blue-700 p-0 mt-2 h-auto font-medium">
                      En savoir plus →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">Conseils d'Utilisation</h3>
                    <p className="text-emerald-800 text-sm leading-relaxed">
                      Commencez par la gestion des utilisateurs, puis configurez vos stocks. Les rapports vous donneront une vue d'ensemble de votre activité.
                    </p>
                    <Button variant="link" className="text-emerald-700 p-0 mt-2 h-auto font-medium">
                      Guide d'utilisation →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
