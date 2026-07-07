// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Images,
  ListMusic,
  Calendar,
  Wallet,
  BarChart3,
  Users,
  User,
  LogOut
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/logo.png';


export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // ============================================================
  // VERIFICAR SE O USUÁRIO É ADMIN
  // ============================================================
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao verificar admin:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
    };

    checkAdmin();
  }, [user]);

  // ============================================================
  // ITENS DO MENU (com link condicional para Usuários)
  // ============================================================
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/devices', icon: Monitor, label: 'Gerenciar TVs' },
    { path: '/media', icon: Images, label: 'Minhas Artes' },
    { path: '/playlists', icon: ListMusic, label: 'Playlists' },
    { path: '/schedules', icon: Calendar, label: 'Agendamento' },
    { path: '/plans', icon: Wallet, label: 'Planos' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    // ⬇️ Link "Usuários" aparece apenas para administradores
    ...(isAdmin ? [{ path: '/admin/users', icon: Users, label: 'Controle de Usuários' }] : []),
  ];

  // ============================================================
  // FUNÇÃO DE LOGOUT
  // ============================================================
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('❌ Erro ao sair:', error);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <aside className="w-64 bg-[#0A0F19] text-white h-screen flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Logo" className="h-20 w-auto" />

        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${isActive
                      ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <item.icon size={20} className={isActive ? 'text-blue-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer – Usuário e Logout */}
      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
            <User size={16} className="text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 border border-white/5 hover:border-red-500/20"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}