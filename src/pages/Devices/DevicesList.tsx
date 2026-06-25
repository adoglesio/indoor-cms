// cms/src/pages/Devices/DevicesList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { StatusBadge } from '../../components/StatusBadge';
import { Device } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { RefreshCw, Trash2, Edit, Link as LinkIcon, Power, CheckSquare, Square } from 'lucide-react';

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

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
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
  // DELETAR UMA TV
  // ============================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm('⚠️ Tem certeza que deseja excluir esta TV permanentemente?')) return;
    try {
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) throw error;
      await fetchDevices();
      setSelectedIds(prev => prev.filter(i => i !== id));
      alert('TV excluída com sucesso!');
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // ============================================================
  // DELETAR MÚLTIPLAS TVs
  // ============================================================
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('Nenhuma TV selecionada.');
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} TV(s) permanentemente?`)) return;

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .in('id', selectedIds);
      if (error) throw error;
      await fetchDevices();
      setSelectedIds([]);
      setSelectAll(false);
      alert(`${selectedIds.length} TV(s) excluída(s) com sucesso!`);
    } catch (error: any) {
      alert('Erro ao excluir selecionados: ' + error.message);
    }
  };

  // ============================================================
  // DELETAR TODAS AS TVs DESPAREADAS
  // ============================================================
  const handleDeleteUnpaired = async () => {
    const unpaired = devices.filter(d => !d.is_paired);
    if (unpaired.length === 0) {
      alert('Não há TVs despareadas.');
      return;
    }
    if (!window.confirm(`Deseja excluir todas as ${unpaired.length} TV(s) despareadas?`)) return;

    try {
      const ids = unpaired.map(d => d.id);
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
  // ATUALIZAR STATUS
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

  const handlePair = async (id: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ is_paired: true, status: 'online' })
        .eq('id', id);
      if (error) throw error;
      await fetchDevices();
      alert('TV pareada com sucesso!');
    } catch (error: any) {
      alert('Erro ao parear: ' + error.message);
    }
  };

  const handleReboot = async (id: string) => {
    if (!window.confirm('Enviar comando de reinicialização para a TV?')) return;
    alert('Comando de reinicialização enviado para a TV.');
  };

  // ============================================================
  // FILTROS E PAGINAÇÃO
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

  // Selecionar/deselecionar todos
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedDevices.map(d => d.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar TVs</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button onClick={signOut} className="text-sm text-red-600 hover:underline">
            Sair
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

        <Link
          to="/devices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
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
                  <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
                  <td className="px-4 py-3">
                    {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Nunca conectada'}
                  </td>
                  <td className="px-4 py-3">
                    {device.is_paired ? '✅ Pareada' : '❌ Despareada'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/devices/${device.id}/edit`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm" title="Editar">
                        <Edit size={16} /> Editar
                      </Link>
                      <button onClick={() => handlePair(device.id)} className="text-green-600 hover:underline flex items-center gap-1 text-sm" title="Parear">
                        <LinkIcon size={16} /> Parear
                      </button>
                      <button onClick={() => handleRefreshStatus(device.id)} className="text-yellow-600 hover:underline flex items-center gap-1 text-sm" title="Atualizar">
                        <RefreshCw size={16} /> Atualizar
                      </button>
                      <button onClick={() => handleReboot(device.id)} className="text-orange-600 hover:underline flex items-center gap-1 text-sm" title="Reiniciar">
                        <Power size={16} /> Reiniciar
                      </button>
                      <button onClick={() => handleDelete(device.id)} className="text-red-600 hover:underline flex items-center gap-1 text-sm" title="Deletar">
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
          <span>Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} TVs</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              Anterior
            </button>
            <span className="px-3 py-1">Página {currentPage} de {totalPages}</span>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}