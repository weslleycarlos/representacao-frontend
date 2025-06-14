// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await getCurrentUser();
        setUser(response.data.user);
        setCompany(response.data.company || null);
      } catch (error) {
        console.error('Erro de autenticação:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token'); // Remove token inválido
        }
        setUser(null);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (credentials) => {
    // Exemplo: chama /api/auth/login
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    const userData = await getCurrentUser();
    setUser(userData.data.user);
    setCompany(userData.data.company || null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);