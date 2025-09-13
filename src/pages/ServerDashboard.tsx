import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Coffee, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  List,
  Utensils
} from 'lucide-react';

export default function ServerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Vérifier que l'utilisateur est bien un serveur
  if (user?.role !== 'server') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès Restreint</CardTitle>
            <CardDescription>
              Cette page est réservée aux serveurs uniquement.
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

  const serverActions = [
    {
      title: 'Nouvelle Commande',
      description: 'Prendre une commande client',
      icon: Plus,
      color: 'bg-green-500',
      action: () => navigate('/orders/new')
    },
    {
      title: 'Mes Commandes',
      description: 'Voir mes commandes en cours',
      icon: List,
      color: 'bg-blue-500',
      action: () => navigate('/orders/my-orders')
    },
    {
      title: 'Gestion des Tables',
      description: 'Attribuer et gérer les tables',
      icon: Coffee,
      color: 'bg-orange-500',
      action: () => navigate('/tables')
    },
    {
      title: 'Menu du Jour',
      description: 'Consulter les plats disponibles',
      icon: Utensils,
      color: 'bg-purple-500',
      action: () => navigate('/menu')
    }
  ];

  const serverStats = [
    {
      title: 'Tables Assignées',
      value: '0',
      icon: Coffee,
      color: 'text-orange-600'
    },
    {
      title: 'Commandes Actives',
      value: '0',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Commandes Terminées',
      value: '0',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'En Attente',
      value: '0',
      icon: AlertCircle,
      color: 'text-yellow-600'
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
                Dashboard Serveur
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
        {/* Statistiques Serveur */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {serverStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions Serveur */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serverActions.map((action, index) => (
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
        </div>

        {/* Informations de Service */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de Service</CardTitle>
            <CardDescription>
              État actuel de votre service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-800">Service Actif</p>
                <p className="text-sm text-green-600">Prêt à prendre des commandes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-800">Temps de Service</p>
                <p className="text-sm text-blue-600">0h 0m</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold text-orange-800">Clients Servis</p>
                <p className="text-sm text-orange-600">0 aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
