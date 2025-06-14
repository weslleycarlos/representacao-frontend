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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const AppContent = () => {
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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/select-company" element={user && !company ? <CompanySelection /> : <Navigate to="/" />} />
        
        <Route 
          path="/*" 
          element={user && company ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<OrdersPage />} />
                {/* Adicione outras rotas aqui conforme necessário */}
                <Route path="*" element={<Navigate to="/" />} /> {/* Redireciona para o dashboard se a rota não for encontrada */}
              </Routes>
            </Layout>
          ) : (
            <Navigate to={user ? "/select-company" : "/login"} />
          )}
        />
      </Routes>
    </Router>
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
