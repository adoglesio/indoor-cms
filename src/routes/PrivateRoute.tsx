// src/routes/PrivateRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();

  // Enquanto está verificando o token no localStorage, exibe um loading
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // Se não tem usuário, manda para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem usuário, mostra a página solicitada
  return <>{children}</>;
}