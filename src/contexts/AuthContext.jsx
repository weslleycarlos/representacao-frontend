// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário está logado ao carregar a aplicação
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await authService.getCurrentUser();
      setUser(response.user);
      setCompany(response.company);
      setCompanies(response.companies || []);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token'); // Remove token inválido
      }
      setUser(null);
      setCompany(null);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setCompanies(response.companies || []);
      
      // Se há apenas uma empresa, seleciona automaticamente
      if (response.companies && response.companies.length === 1) {
        await selectCompany(response.companies[0].id);
      } else {
        setCompany(response.company);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const response = await authService.register(email, password);
      setUser(response.user);
      setCompanies(response.companies || []);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setCompany(null);
      setCompanies([]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setUser(null);
      setCompany(null);
      setCompanies([]);
    }
  };

  const selectCompany = async (companyId) => {
    try {
      const response = await authService.selectCompany(companyId);
      setCompany(response.company);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    company,
    companies,
    loading,
    login,
    register,
    logout,
    selectCompany,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};