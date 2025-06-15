import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App'; // Importamos o App principal
import LoginPage from './components/LoginPage';
import CompanySelection from './components/CompanySelection';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/select-company',
    element: <CompanySelection />,
  },
  {
    path: '/',
    element: <App />, // Toda a lógica do app fica aqui
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);