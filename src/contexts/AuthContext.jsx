import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../lib/api';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [companies, setCompanies] = useState([]); // NOVO ESTADO
  const [loadingCompanies, setLoadingCompanies] = useState(false); // NOVO ESTADO

  // Verifica se o usuário está logado ao carregar a aplicação
  useEffect(() => {
    if (user && companies.length === 0 && !loadingCompanies) {
      loadCompanies();
    }
  }, [user, companies.length, loadingCompanies]);

  const checkAuth = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.user);
      setCompany(response.company);
      
      // Se não há empresa selecionada, busca as empresas disponíveis
      if (!response.company) {
        // Aqui você pode implementar uma chamada para buscar as empresas do usuário
        // Por enquanto, vamos assumir que as empresas vêm no login
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      setCompany(response.data.company);
      // Se o backend retornar um token, você pode armazená-lo aqui (ex: localStorage)
      // localStorage.setItem('accessToken', response.data.access_token);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login.');
      throw err;
    }
  };



  const register = async (email, password) => {
    try {
      const response = await authService.register(email, password);
      return response;
    } catch (error) {
      throw error;
    }
  };

   const logout = async () => {
    try {
      await api.post('/auth/logout'); // Assumindo que o backend invalida a sessão
      setUser(null);
      setCompany(null);
      // Se você armazenou um token, remova-o aqui
      // localStorage.removeItem('accessToken');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await api.get("/auth/companies"); // Assumindo que esta é a rota para buscar empresas
      setCompanies(response.data.companies);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
      setError(err.response?.data?.error || "Erro ao carregar empresas.");
    } finally {
      setLoadingCompanies(false);
    }
  };

 const selectCompany = async (companyId) => {
    setError(null);
    try {
      const response = await api.post('/auth/select-company', { company_id: companyId });
      setCompany(response.data.company);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao selecionar empresa.');
      throw err;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
        setCompany(response.data.company);
        // Se o usuário estiver logado, carregue as empresas
        if (response.data.user) {
          await loadCompanies();
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log("Usuário não autenticado.");
        } else {
          console.error("Erro ao verificar autenticação:", error);
        }
        setUser(null);
        setCompany(null);
      } finally {
        setLoading(false);
        setInitialAuthCheckComplete(true);
      }
    };

    checkAuthStatus();
  }, []);


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
      loading,
      error,
      login,
      logout,
      selectCompany,
      initialAuthCheckComplete,
      companies, // INCLUA NO CONTEXTO
      loadingCompanies // INCLUA NO CONTEXTO
    }}>
      {children}
    </AuthContext.Provider>
  );
};


