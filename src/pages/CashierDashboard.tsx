import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ShoppingCart,
  History,
  Users,
  BarChart3,
  Clock,
  DollarSign,
  Package,
  Coffee,
  User,
  Receipt
} from 'lucide-react';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Vérifier que l'utilisateur est bien un caissier
  if (user?.role !== 'cashier') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès Restreint</CardTitle>
            <CardDescription>
              Cette page est réservée aux caissiers uniquement.
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

  const quickActions = [
    {
      title: 'Nouvelle Vente',
      description: 'Point de vente et gestion des commandes',
      icon: ShoppingCart,
      color: 'bg-green-500',
      action: () => navigate('/sales')
    },
    {
      title: 'Historique',
      description: 'Consultation des ventes passées',
      icon: History,
      color: 'bg-blue-500',
      action: () => navigate('/sales-history')
    },
    {
      title: 'Tables',
      description: 'Gestion des tables et réservations',
      icon: Coffee,
      color: 'bg-orange-500',
      action: () => navigate('/tables')
    },
    {
      title: 'Dépenses',
      description: 'Enregistrer les petites dépenses de caisse',
      icon: Receipt,
      color: 'bg-red-500',
      action: () => navigate('/expenses')
    },
    {
      title: 'Profil',
      description: 'Gestion de votre profil personnel',
      icon: User,
      color: 'bg-purple-500',
      action: () => navigate('/profile')
    }
  ];

  // Statistiques supprimées - Interface simplifiée pour caissier

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête Dashboard Caissier */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            En tant que <strong>Caissier</strong>, vous avez accès aux fonctionnalités suivantes :
          </p>
        </div>

        {/* Actions Principales */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Vos Fonctionnalités
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-200"
                onClick={action.action}
              >
                <CardContent className="p-4 sm:p-8">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className={`p-3 sm:p-4 rounded-xl ${action.color} shadow-lg`}>
                      <action.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Message d'aide simple */}
        <div className="mt-6 sm:mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div>
                  <p className="text-blue-800 font-medium text-sm sm:text-base">Conseil</p>
                  <p className="text-blue-700 text-xs sm:text-sm">
                    Utilisez le menu de navigation à gauche pour accéder rapidement à vos fonctionnalités.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
