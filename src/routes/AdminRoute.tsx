
import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('🔍 Verificando admin para:', user.email);

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📦 Resultado:', data);

      if (error) {
        console.error('❌ Erro:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B16] flex items-center justify-center">
        <div className="text-white">Verificando permissões...</div>
      </div>
    );
  }

  console.log('✅ isAdmin:', isAdmin);

  if (!user || !isAdmin) {
    console.log('⛔ Redirecionando para /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}