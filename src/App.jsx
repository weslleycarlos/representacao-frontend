import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrdersPage from './components/OrdersPage';
import { useServiceWorker } from './hooks/useOffline';
import { Loader2 } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

const AppContent = () => {
  const { user, company, loading } = useAuth();
  const navigate = useNavigate();

  useServiceWorker();

  // Redirecionamentos baseados no estado de autenticação
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (!company) {
        navigate('/select-company');
      }
    }
  }, [user, company, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <Outlet /> {/* Renderiza as rotas filhas */}
    </Layout>
  );
};

// Rotas protegidas
function App() {
  return (
    <AppContent />
  );
}

export default App;