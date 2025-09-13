import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import all pages to test basic rendering
import Profile from '../pages/Profile';
import Sales from '../pages/Sales';
import Stocks from '../pages/Stocks';
import StockSync from '../pages/StockSync';
import Supplies from '../pages/Supplies';
import SalesHistory from '../pages/SalesHistory';
import DailyReport from '../pages/DailyReport';
import Reports from '../pages/Reports';
import Analytics from '../pages/Analytics';
import Tables from '../pages/Tables';
import Orders from '../pages/Orders';
import Users from '../pages/Users';
import Suppliers from '../pages/Suppliers';
import Expenses from '../pages/Expenses';
import Settings from '../pages/Settings';
import Alerts from '../pages/Alerts';
import Monitoring from '../pages/Monitoring';
import Help from '../pages/Help';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Pages Rendering Tests', () => {
  it('should render Profile page without crashing', () => {
    renderWithProviders(<Profile />);
    expect(screen.getByText('Profil utilisateur')).toBeInTheDocument();
  });

  it('should render Sales page without crashing', () => {
    renderWithProviders(<Sales />);
    expect(screen.getByText('Point de Vente')).toBeInTheDocument();
  });

  it('should render Stocks page without crashing', () => {
    renderWithProviders(<Stocks />);
    expect(screen.getByText('Gestion des stocks')).toBeInTheDocument();
  });

  it('should render StockSync page without crashing', () => {
    renderWithProviders(<StockSync />);
    expect(screen.getByText('Synchronisation des stocks')).toBeInTheDocument();
  });

  it('should render Supplies page without crashing', () => {
    renderWithProviders(<Supplies />);
    expect(screen.getByText('Approvisionnements')).toBeInTheDocument();
  });

  it('should render SalesHistory page without crashing', () => {
    renderWithProviders(<SalesHistory />);
    expect(screen.getByText('Historique des ventes')).toBeInTheDocument();
  });

  it('should render DailyReport page without crashing', () => {
    renderWithProviders(<DailyReport />);
    expect(screen.getByText('Rapport quotidien')).toBeInTheDocument();
  });

  it('should render Reports page without crashing', () => {
    renderWithProviders(<Reports />);
    expect(screen.getByText('Génération de rapports')).toBeInTheDocument();
  });

  it('should render Analytics page without crashing', () => {
    renderWithProviders(<Analytics />);
    expect(screen.getByText('Analyses avancées')).toBeInTheDocument();
  });

  it('should render Tables page without crashing', () => {
    renderWithProviders(<Tables />);
    expect(screen.getByText('Gestion des tables')).toBeInTheDocument();
  });

  it('should render Orders page without crashing', () => {
    renderWithProviders(<Orders />);
    expect(screen.getByText('Gestion des commandes')).toBeInTheDocument();
  });

  it('should render Users page without crashing', () => {
    renderWithProviders(<Users />);
    expect(screen.getByText('Gestion des utilisateurs')).toBeInTheDocument();
  });

  it('should render Suppliers page without crashing', () => {
    renderWithProviders(<Suppliers />);
    expect(screen.getByText('Gestion des fournisseurs')).toBeInTheDocument();
  });

  it('should render Expenses page without crashing', () => {
    renderWithProviders(<Expenses />);
    expect(screen.getByText('Gestion des dépenses')).toBeInTheDocument();
  });

  it('should render Settings page without crashing', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText('Paramètres système')).toBeInTheDocument();
  });

  it('should render Alerts page without crashing', () => {
    renderWithProviders(<Alerts />);
    expect(screen.getByText('Centre d\'alertes')).toBeInTheDocument();
  });

  it('should render Monitoring page without crashing', () => {
    renderWithProviders(<Monitoring />);
    expect(screen.getByText('Surveillance système')).toBeInTheDocument();
  });

  it('should render Help page without crashing', () => {
    renderWithProviders(<Help />);
    expect(screen.getByText('Centre d\'aide')).toBeInTheDocument();
  });
});
