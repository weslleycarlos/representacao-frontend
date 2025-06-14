import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CompanySelection from './CompanySelection';
import Layout from './Layout';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const ProtectedLayout = () => {
  const { user, company, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se o usuário não estiver logado, redireciona para a página de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, mas sem empresa, mostra a tela de seleção de empresa
  if (!company) {
    return <CompanySelection />;
  }

  // Se estiver tudo certo, renderiza o Layout principal
  // O <Outlet /> é onde o react-router vai renderizar a página filha (Dashboard, OrdersPage, etc.)
  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;