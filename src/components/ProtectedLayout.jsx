import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedLayout = () => {
  const { user, loading, company, companies } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!company && companies.length > 0) {
    return <Navigate to="/select-company" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;