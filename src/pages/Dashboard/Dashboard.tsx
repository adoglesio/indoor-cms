// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Tv, Monitor, List, Calendar, Plus, FileText } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  orientation: 'horizontal' | 'vertical';
  status: 'online' | 'offline';
  active_playlist_id: string | null;
  last_seen_at: string | null;
  is_paired: boolean;
  sector: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistsCount, setPlaylistsCount] = useState(0);
  const [schedulesCount, setSchedulesCount] = useState(0);
  const [totalSlots] = useState(3); // número máximo de pontos (fixo ou vindo do plano)

  const displayName = user?.user_metadata?.full_name || user?.email || 'Usuário';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Buscar TVs
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });
      if (devicesError) throw devicesError;
      setDevices(devicesData || []);

      // Buscar playlists ativas
      const { count: playlistsCount, error: playlistsError } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true });
      if (!playlistsError) setPlaylistsCount(playlistsCount || 0);

      // Buscar agendamentos (se a tabela existir)
      const { count: schedulesCount, error: schedulesError } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true });
      if (!schedulesError) setSchedulesCount(schedulesCount || 0);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const usedSlots = devices.length; // cada TV ocupa um ponto
  const availableSlots = Math.max(0, totalSlots - usedSlots);

  return (
    <div className="space-y-6">
      {/* Título e saudação */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">Bem-vindo, {displayName}!</p>
        </div>
        <div className="text-sm text-gray-400">
          Última atualização: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: TVs Cadastradas */}
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">TVs Cadastradas</p>
              <p className="text-2xl font-bold">{totalDevices}</p>
              <div className="flex gap-2 text-xs mt-1">
                <span className="text-green-600">● {onlineDevices} Online</span>
                <span className="text-red-600">● {offlineDevices} Offline</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Tv className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <Link to="/devices" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            + Gerenciar TVs
          </Link>
        </div>

        {/* Card: Pontos de TV Disponíveis */}
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pontos de TV Disponíveis</p>
              <p className="text-2xl font-bold">{availableSlots} de {totalSlots}</p>
              <p className="text-xs text-gray-500">{usedSlots} em uso</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Monitor className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            + Contratar mais pontos
          </button>
        </div>

        {/* Card: Playlists Ativas */}
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Playlists Ativas</p>
              <p className="text-2xl font-bold">{playlistsCount}</p>
              <p className="text-xs text-gray-500">{playlistsCount === 0 ? 'Nenhuma ativa' : `${playlistsCount} ativa(s)`}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <List className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to="/playlists" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            + Criar Playlist
          </Link>
        </div>

        {/* Card: Agendamentos */}
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Agendamentos</p>
              <p className="text-2xl font-bold">{schedulesCount}</p>
              <p className="text-xs text-gray-500">{schedulesCount === 0 ? 'Nenhum agendamento' : `${schedulesCount} agendamento(s)`}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            + Agendar Arte
          </button>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/devices" className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition">
            <Plus className="w-4 h-4" /> Adicionar TV
          </Link>
          <Link to="/playlists" className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm hover:bg-purple-100 transition">
            <Plus className="w-4 h-4" /> Criar Playlist
          </Link>
          <Link to="/reports" className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm hover:bg-green-100 transition">
            <FileText className="w-4 h-4" /> Ver Relatórios
          </Link>
        </div>
      </div>

      {/* Tabela de TVs Cadastradas */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">TVs Cadastradas ({totalDevices})</h2>
          <Link to="/devices" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma TV cadastrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Nome da TV</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Orientação</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Playlist Atual</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Última Atualização</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Código da TV</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {devices.slice(0, 5).map((device) => (
                  <tr key={device.id}>
                    <td className="px-4 py-2 font-medium">{device.name}</td>
                    <td className="px-4 py-2 capitalize">{device.orientation}</td>
                    <td className="px-4 py-2"><StatusBadge status={device.status} /></td>
                    <td className="px-4 py-2">{device.active_playlist_id ? 'Playlist' : 'Nenhuma'}</td>
                    <td className="px-4 py-2">
                      {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'TV nunca conectada'}
                    </td>
                    <td className="px-4 py-2">
                      {device.is_paired ? 'Pareada' : 'Não pareada'}
                    </td>
                    <td className="px-4 py-2">
                      <Link to={`/devices/${device.id}/edit`} className="text-blue-600 hover:underline">
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {devices.length > 5 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Mostrando 5 de {devices.length} TVs
              </div>
            )}
          </div>
        )}
      </div>

      {/* Atividade Recente */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Atividade Recente</h2>
        <div className="text-sm text-gray-500">
          Nenhuma atividade registrada ainda.
        </div>
      </div>
    </div>
  );
}