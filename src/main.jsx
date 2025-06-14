import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ProtectedLayout from './components/ProtectedLayout';
import Dashboard from './components/Dashboard';
import OrdersPage from './components/OrdersPage';

import './index.css';

const router = createBrowserRouter([
  {
    // Rota pública: qualquer um pode acessar
    path: '/login',
    element: <LoginPage />,
  },
  {
    // Rotas protegidas: só acessa se estiver logado
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        // AQUI ESTÁ A CORREÇÃO PRINCIPAL:
        // "index: true" define esta como a rota padrão para o caminho do pai ('/').
        // Isso remove a ambiguidade do "path: '/'".
        index: true,
        element: <Dashboard />,
      },
      {
        // O caminho da rota filha é relativo ao pai, então não usamos a barra '/'.
        path: 'roteiro',
        element: <OrdersPage />,
      },
      // Adicione aqui outras rotas protegidas que você venha a criar
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);