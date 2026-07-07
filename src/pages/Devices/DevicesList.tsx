// src/pages/Devices/DevicesList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { StatusBadge } from '../../components/StatusBadge';
import { Device } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  RefreshCw,
  Trash2,
  Edit,
  Link as LinkIcon,
  Power,
  CheckSquare,
  Square,
  User,
  LogOut,
  WifiOff,
  Camera,
  X,
} from 'lucide-react';

export function DevicesList() {
  const { user, signOut } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [screenshotDevice, setScreenshotDevice] = useState<Device | null>(null);
  const [screenshotWaiting, setScreenshotWaiting] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    if (!user?.id) {
      setDevices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .is('deleted_at', null)
        .eq('owner_id', user.id) // 🔥 FILTRO POR USUÁRIO
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao buscar dispositivos:', error);
      alert('Erro ao carregar lista de TVs: ' + error.message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // 1. DELETAR TV (com desconexão do Player)
  // ============================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm('⚠️ Tem certeza que deseja excluir esta TV permanentemente?')) return;
    try {
      // Verifica se a TV pertence ao usuário (segurança extra)
      const { data: device } = await supabase
        .from('devices')
        .select('owner_id')
        .eq('id', id)
        .single();

      if (device?.owner_id !== user?.id) {
        alert('❌ Você não tem permissão para excluir esta TV.');
        return;
      }

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          deleted_at: new Date().toISOString(),
          is_paired: false,
          status: 'offline',
        })
        .eq('id', id);
      if (updateError) throw updateError;

      await new Promise((resolve) => setTimeout(resolve, 600));

      const { error: deleteError } = await supabase.from('devices').delete().eq('id', id);
      if (deleteError) throw deleteError;

      await fetchDevices();
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      alert('TV excluída com sucesso! O Player será desconectado.');
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // ============================================================
  // 2. DELETAR MÚLTIPLAS TVs (com desconexão do Player)
  // ============================================================
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Nenhuma TV selecionada.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} TV(s) permanentemente?`)) return;

    try {
      // Verifica se todas as TVs pertencem ao usuário
      const { data: devices, error: checkError } = await supabase
        .from('devices')
        .select('id, owner_id')
        .in('id', selectedIds);

      if (checkError) throw checkError;
      const invalid = devices?.some(d => d.owner_id !== user?.id);
      if (invalid) {
        alert('❌ Você não tem permissão para excluir algumas TVs selecionadas.');
        return;
      }

      const { error: updateError } = await supabase
        .from('devices')
        .update({
          deleted_at: new Date().toISOString(),
          is_paired: false,
          status: 'offline',
        })
        .in('id', selectedIds);
      if (updateError) throw updateError;

      await new Promise((resolve) => setTimeout(resolve, 600));

      const { error: deleteError } = await supabase
        .from('devices')
        .delete()
        .in('id', selectedIds);
      if (deleteError) throw deleteError;

      await fetchDevices();
      setSelectedIds([]);
      setSelectAll(false);
      alert(`${selectedIds.length} TV(s) excluída(s) com sucesso!`);
    } catch (error: any) {
      alert('Erro ao excluir selecionados: ' + error.message);
    }
  };

  // ============================================================
  // 3. DELETAR TVs DESPAREADAS (sem Player conectado)
  // ============================================================
  const handleDeleteUnpaired = async () => {
    const unpaired = devices.filter((d) => !d.is_paired);
    if (unpaired.length === 0) {
      alert('Não há TVs despareadas.');
      return;
    }
    if (!window.confirm(`Deseja excluir todas as ${unpaired.length} TV(s) despareadas?`)) return;
    try {
      const ids = unpaired.map((d) => d.id);
      const { error } = await supabase.from('devices').delete().in('id', ids);
      if (error) throw error;
      await fetchDevices();
      setSelectedIds([]);
      setSelectAll(false);
      alert(`${ids.length} TV(s) despareadas excluídas!`);
    } catch (error: any) {
      alert('Erro ao excluir despareadas: ' + error.message);
    }
  };

  // ============================================================
  // 4. RESETAR CONEXÃO (desconectar Player manualmente)
  // ============================================================
  const handleResetConnection = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desconectar o Player desta TV?')) return;
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          is_paired: false,
          status: 'offline',
          last_seen_at: null,
        })
        .eq('id', id);
      if (error) throw error;
      await fetchDevices();
      alert('Conexão resetada! O Player será desconectado.');
    } catch (error: any) {
      alert('Erro ao resetar conexão: ' + error.message);
    }
  };

  // ============================================================
  // 5. ATUALIZAR STATUS
  // ============================================================
  const handleRefreshStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ status: 'online', last_seen_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchDevices();
      alert('Status atualizado para ONLINE.');
    } catch (error: any) {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  // ============================================================
  // 6. PAREAR TV (com verificação de limite do plano)
  // ============================================================
  const handlePair = async (id: string) => {
    try {
      // 1. Buscar limite do plano do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('points_included')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const limit = profile?.points_included || 3;

      // 2. Contar TVs já pareadas (is_paired = true e não deletadas)
      const { count, error: countError } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('owner_id', user?.id)
        .eq('is_paired', true);

      if (countError) throw countError;

      // 3. Se já atingiu o limite, bloqueia
      if (count !== null && count >= limit) {
        alert(`❌ Limite do plano atingido! Você já possui ${count} TV(s) pareadas de ${limit} permitidas.`);
        return;
      }

      // 4. Prossegue com o pareamento
      const { error } = await supabase
        .from('devices')
        .update({
          is_paired: true,
          status: 'online',
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await fetchDevices();
      alert('TV pareada com sucesso!');
    } catch (error: any) {
      alert('Erro ao parear: ' + error.message);
    }
  };

  // ============================================================
  // 7. REINICIAR TV
  // ============================================================
  const handleReboot = async (id: string) => {
    if (!window.confirm('Enviar comando de reinicialização para a TV?')) return;
    try {
      await supabase.from('devices').update({ restart_at: new Date().toISOString() }).eq('id', id);
      alert('Comando enviado! A TV vai reiniciar a playlist.');
    } catch (error: any) {
      alert('Erro ao reiniciar: ' + error.message);
    }
  };

  // ============================================================
  // SCREENSHOT REMOTO: pede pra TV tirar uma foto da tela agora
  // ============================================================
  const handleRequestScreenshot = async (device: Device) => {
    setScreenshotDevice(device);
    setScreenshotError(null);
    setScreenshotWaiting(true);

    const requestedAt = new Date().toISOString();
    const { error } = await supabase
      .from('devices')
      .update({ screenshot_requested_at: requestedAt })
      .eq('id', device.id);

    if (error) {
      setScreenshotWaiting(false);
      setScreenshotError('Erro ao enviar o pedido: ' + error.message);
      return;
    }

    // A TV pode estar offline ou demorar — espera até 20s pela resposta,
    // checando a cada 2s se screenshot_taken_at ficou mais novo que o pedido.
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const { data } = await supabase
        .from('devices')
        .select('*')
        .eq('id', device.id)
        .maybeSingle();

      if (data?.screenshot_taken_at && data.screenshot_taken_at > requestedAt) {
        setScreenshotDevice(data as Device);
        setScreenshotWaiting(false);
        return;
      }
    }

    setScreenshotWaiting(false);
    setScreenshotError('A TV não respondeu a tempo. Verifique se ela está ligada e conectada.');
  };

  // ============================================================
  // 8. FILTROS E PAGINAÇÃO
  // ============================================================
  const filtered = devices.filter((d) => {
    const matchName = d.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchName && matchStatus;
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedDevices.map((d) => d.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ============================================================
  // 9. RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar TVs</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Link to="/profile" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <User size={16} /> Meu Perfil
          </Link>
          <button onClick={signOut} className="text-sm text-red-600 hover:underline flex items-center gap-1">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar nome ou localização..."
            className="w-full border p-2 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="border p-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <button
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          onClick={() => { setSearch(''); setStatusFilter(''); }}
        >
          Limpar filtros
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          onClick={handleDeleteUnpaired}
        >
          <Trash2 size={16} /> Limpar TVs não pareadas
        </button>
        {selectedIds.length > 0 && (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
            onClick={handleDeleteSelected}
          >
            <Trash2 size={16} /> Deletar selecionadas ({selectedIds.length})
          </button>
        )}
        <Link to="/devices/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Adicionar TV
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : paginatedDevices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhuma TV cadastrada.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left">
                  <button onClick={handleSelectAll} className="text-gray-500">
                    {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome da TV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orientação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Playlist</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Conexão</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pareamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedDevices.map((device) => (
                <tr key={device.id}>
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(device.id)}
                      onChange={() => toggleSelect(device.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{device.name}</td>
                  <td className="px-4 py-3 capitalize">{device.orientation}</td>
                  <td className="px-4 py-3">{device.active_playlist_id ? 'Playlist' : 'Sem playlist'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={device.status} />
                  </td>
                  <td className="px-4 py-3">
                    {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Nunca conectada'}
                  </td>
                  <td className="px-4 py-3">{device.is_paired ? '✅ Pareada' : '❌ Despareada'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/devices/${device.id}/edit`}
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                        title="Editar"
                      >
                        <Edit size={16} /> Editar
                      </Link>
                      <button
                        onClick={() => handlePair(device.id)}
                        className="text-green-600 hover:underline flex items-center gap-1 text-sm"
                        title="Parear"
                      >
                        <LinkIcon size={16} /> Parear
                      </button>
                      <button
                        onClick={() => handleRefreshStatus(device.id)}
                        className="text-yellow-600 hover:underline flex items-center gap-1 text-sm"
                        title="Atualizar status"
                      >
                        <RefreshCw size={16} /> Atualizar
                      </button>
                      <button
                        onClick={() => handleRequestScreenshot(device)}
                        className="text-purple-600 hover:underline flex items-center gap-1 text-sm"
                        title="Ver o que está passando na TV agora"
                      >
                        <Camera size={16} /> Ver Tela
                      </button>
                      <button
                        onClick={() => handleReboot(device.id)}
                        className="text-orange-600 hover:underline flex items-center gap-1 text-sm"
                        title="Reiniciar"
                      >
                        <Power size={16} /> Reiniciar
                      </button>
                      <button
                        onClick={() => handleResetConnection(device.id)}
                        className="text-red-500 hover:underline flex items-center gap-1 text-sm"
                        title="Desconectar Player"
                      >
                        <WifiOff size={16} /> Desconectar
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
                        className="text-red-700 hover:underline flex items-center gap-1 text-sm"
                        title="Deletar"
                      >
                        <Trash2 size={16} /> Deletar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalItems > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} TVs
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal de Screenshot Remoto */}
      {screenshotDevice && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setScreenshotDevice(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{screenshotDevice.name}</h3>
                <p className="text-xs text-gray-500">
                  {screenshotDevice.screenshot_taken_at
                    ? `Capturado em ${new Date(screenshotDevice.screenshot_taken_at).toLocaleString()}`
                    : 'Aguardando a TV responder...'}
                </p>
              </div>
              <button onClick={() => setScreenshotDevice(null)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <div className="bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
              {screenshotWaiting ? (
                <div className="text-center py-16 text-gray-500">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
                  Pedindo pra TV tirar uma foto da tela...
                </div>
              ) : screenshotError ? (
                <div className="text-center py-16 text-red-600 px-6">{screenshotError}</div>
              ) : screenshotDevice.screenshot_url ? (
                <img
                  src={screenshotDevice.screenshot_url}
                  alt={`Tela de ${screenshotDevice.name}`}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              ) : (
                <div className="text-center py-16 text-gray-500">Nenhuma captura ainda.</div>
              )}
            </div>

            {screenshotDevice.now_playing && (
              <p className="text-sm text-gray-600 mt-3">
                📺 Tocando agora: <span className="font-medium">{screenshotDevice.now_playing}</span>
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => handleRequestScreenshot(screenshotDevice)}
                disabled={screenshotWaiting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
              >
                <Camera size={16} /> {screenshotWaiting ? 'Aguardando...' : 'Tirar nova foto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}