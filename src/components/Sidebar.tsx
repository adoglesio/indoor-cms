
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  Images,
  ListMusic,
  Calendar,
  Wallet,
  BarChart3,
} from 'lucide-react';
import logo from '../assets/logo.png';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/devices', icon: Monitor, label: 'Gerenciar TVs' },
  { path: '/media', icon: Images, label: 'Minhas Artes' },
  { path: '/playlists', icon: ListMusic, label: 'Playlists' },
  { path: '/schedules', icon: Calendar, label: 'Agendamento' }, // ← CORRIGIDO: /schedules
  { path: '/plans', icon: Wallet, label: 'Planos' },
  { path: '/reports', icon: BarChart3, label: 'Relatórios' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4">
      <div className="text-2xl font-bold mb-8">
        <img src={logo} alt="Logo" className="h-50 w-auto" />
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              location.pathname === item.path ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}