import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // Isso envia cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('token');
    const response = await api.post('/auth/logout');
    return response.data;
  },

selectCompany: async (companyId) => {
  try {
    // Converta explicitamente para string e use o formato exato que o backend espera
    const payload = {
      company_id: String(companyId) // Garante que é string
    };
    
    console.log('Enviando payload:', payload); // Log para debug
    
    const response = await api.post('/auth/select-company', {
      company_id: String(companyId)  // Garante que é string
    });
    
    return response.data;
  } catch (error) {
    console.error('Detalhes do erro:', {
      url: error.config?.url,
      method: error.config?.method,
      payload: error.config?.data,
      status: error.response?.status,
      responseData: error.response?.data
    });
    throw error;
  }
}
}; 


export const dashboardService = {
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },

  getPendingOrdersCount: async () => {
    const response = await api.get('/dashboard/pending-orders-count');
    return response.data;
  }
};

export const cnpjService = {
  consultar: async (cnpj) => {
    const response = await api.post('/cnpj/consultar', { cnpj });
    return response.data;
  }
};

export const ordersService = {
  getOrders: async () => {
    const response = await api.get('/orders/');
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  syncOrders: async (orders) => {
    const response = await api.post('/orders/sync', { orders });
    return response.data;
  }
};

export const catalogService = {
  getProducts: async () => {
    const response = await api.get('/catalog/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/catalog/products', productData);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/catalog/payment-methods');
    return response.data;
  },

  createPaymentMethod: async (paymentMethodData) => {
    const response = await api.post('/catalog/payment-methods', paymentMethodData);
    return response.data;
  }
};

export default api;