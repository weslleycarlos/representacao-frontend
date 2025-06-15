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
    const response = await authService.getCurrentUser(); // Agora vai funcionar
    setUser(response.user);
    setCompany(response.company || null);
    setCompanies(response.companies || []);
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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
    
    // Modifique esta lógica
    if (response.companies && response.companies.length > 0) {
      if (response.companies.length === 1) {
        // Aguarde a seleção da empresa antes de continuar
        await selectCompany(response.companies[0].id);
      }
      // Se tiver mais de uma, o usuário precisa selecionar
    } else {
      setCompany(null); // Nenhuma empresa disponível
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
    console.log('Tentando selecionar empresa:', {
      id: companyId,
      tipo: typeof companyId
    });
    
    const response = await authService.selectCompany(String(companyId));
    setCompany(response.company);
    return response;
  } catch (error) {
    console.error('Falha completa:', {
      erro: error.message,
      resposta: error.response?.data,
      stack: error.stack
    });
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
    <AuthContext.Provider value={{
      user,
      company,
      companies,
      loading,
      login,
      register,
      logout,
      selectCompany,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};