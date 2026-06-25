// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// ============================================================
// 1. INTERFACE do Contexto
// ============================================================
interface AuthContextData {
  user: User | null;
  session: Session | null;        // Adicionado para acesso à sessão, se necessário
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>; // Útil para forçar atualização
}

// ============================================================
// 2. CRIAÇÃO do Contexto
// ============================================================
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// ============================================================
// 3. PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------------------------
  // 3.1 Inicialização e listener de autenticação
  // ----------------------------------------------------------
  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Escuta mudanças de autenticação (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------------
  // 3.2 FUNÇÕES de Autenticação
  // ----------------------------------------------------------

  // -------- LOGIN --------
  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Força atualização da sessão (já feito pelo listener, mas garantia extra)
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      console.error('❌ Erro no login:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  // -------- CADASTRO --------
  async function signUp(name: string, email: string, password: string) {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) throw error;

      console.log('✅ Cadastro realizado com sucesso:', data);

      // Se o e-mail for confirmado automaticamente (sem confirmação),
      // a sessão já virá preenchida. Caso contrário, será null.
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      } else {
        // Se a confirmação de e-mail estiver ativada, avise o usuário
        console.warn('⚠️ Confirme seu e-mail antes de fazer login.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido no cadastro';
      console.error('❌ Erro no cadastro:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  // -------- LOGOUT --------
  async function signOut() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Os estados são limpos pelo listener onAuthStateChange
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sair';
      console.error('❌ Erro ao sair:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  // -------- FORÇAR REFRESH DA SESSÃO --------
  async function refreshSession() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar sessão';
      console.error('❌ Erro no refresh:', message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // 4. EXPOSIÇÃO do Contexto
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// 5. HOOK PERSONALIZADO
// ============================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}