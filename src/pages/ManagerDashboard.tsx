import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  BarChart3, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Settings,
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Vérifier que l'utilisateur est bien un manager
  if (user?.role !== 'manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès Restreint</CardTitle>
            <CardDescription>
              Cette page est réservée aux managers uniquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const managerActions = [
    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les employés et leurs rôles',
      icon: Users,
      color: 'bg-blue-500',
      action: () => navigate('/users')
    },
    {
      title: 'Rapports & Analytics',
      description: 'Consulter les performances',
      icon: BarChart3,
      color: 'bg-green-500',
      action: () => navigate('/reports')
    },
    {
      title: 'Gestion des Produits',
      description: 'Catalogue et inventaire',
      icon: Package,
      color: 'bg-purple-500',
      action: () => navigate('/products')
    },
    {
      title: 'Configuration',
      description: 'Paramètres du restaurant',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Manager
              </h1>
              <p className="text-gray-600">
                Bienvenue, {user?.first_name || user?.username} 👋
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="text-red-600 hover:text-red-700"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Manager */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {managerActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.action}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistiques Manager */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Revenus du Mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0 FCFA</p>
              <p className="text-sm text-gray-600">+0% par rapport au mois dernier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0%</p>
              <p className="text-sm text-gray-600">Taux de satisfaction client</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Alertes en attente</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
