import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import CompanySelection from './components/CompanySelection';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrdersPage from './components/OrdersPage';
import { useServiceWorker } from './hooks/useOffline';
import { Loader2 } from 'lucide-react';
import './App.css';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, company, loading } = useAuth();

  // Registra o service worker
  useServiceWorker();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se não está logado, mostra a página de login
  if (!user) {
    return <LoginPage />;
  }

  // Se está logado mas não selecionou empresa, mostra seleção de empresa
  if (!company) {
    return <CompanySelection />;
  }

  // Renderiza a página atual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrdersPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

