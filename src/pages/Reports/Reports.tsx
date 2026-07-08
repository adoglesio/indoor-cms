// src/pages/Reports/Reports.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Printer, Download, Eye } from 'lucide-react';

interface PlaylistOption {
  id: string;
  name: string;
}

interface MediaSummary {
  name: string;
  duration: number | null;
  totalExibicoes: number;
}

interface DeviceExibicao {
  deviceId: string;
  deviceName: string;
  totalExibicoes: number;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reports() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [mediaSummary, setMediaSummary] = useState<MediaSummary | null>(null);
  const [deviceRows, setDeviceRows] = useState<DeviceExibicao[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (user?.id) fetchPlaylists();
  }, [user]);

  async function fetchPlaylists() {
    const { data } = await supabase
      .from('playlists')
      .select('id, name')
      .eq('owner_id', user!.id) // 🔥 cada usuário só vê as próprias playlists no filtro
      .order('name');
    const list = data || [];
    setPlaylists(list);
    if (list.length > 0) setSelectedPlaylistId(list[0].id);
  }

  async function handleVisualizar() {
    if (!selectedPlaylistId || !user?.id) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

      // Intervalo do dia inteiro, na data local escolhida
      const startISO = `${startDate}T00:00:00`;
      const endISO = `${endDate}T23:59:59`;

      const { data: logs, error } = await supabase
        .from('playback_logs')
        .select('id, device_id, media_name, duration_seconds, played_at, devices(name)')
        .eq('owner_id', user.id) // 🔥 isolamento por usuário
        .eq('playlist_id', selectedPlaylistId)
        .gte('played_at', startISO)
        .lte('played_at', endISO);

      if (error) throw error;

      const rows = logs || [];

      // Resumo da mídia (playlist): duração média registrada + total de exibições
      const totalExibicoes = rows.length;
      const durations = rows.map((r: any) => r.duration_seconds).filter((d: any) => d != null);
      const avgDuration = durations.length
        ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : null;

      setMediaSummary({
        name: selectedPlaylist?.name || '',
        duration: avgDuration,
        totalExibicoes,
      });

      // Agrupa por ponto de exibição (TV)
      const byDevice: Record<string, DeviceExibicao> = {};
      rows.forEach((r: any) => {
        const id = r.device_id || 'desconhecido';
        const name = r.devices?.name || 'TV removida';
        if (!byDevice[id]) {
          byDevice[id] = { deviceId: id, deviceName: name, totalExibicoes: 0 };
        }
        byDevice[id].totalExibicoes++;
      });
      setDeviceRows(Object.values(byDevice).sort((a, b) => a.deviceName.localeCompare(b.deviceName)));
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      alert('Erro ao gerar relatório: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function csvEscape(value: string) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  function exportCSV() {
    if (!mediaSummary) return;
    const lines: string[] = [];

    lines.push(`Relatório de exibições — ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`);
    lines.push('');
    lines.push(['Mídia', 'Duração (s)', 'Total de Exibições'].join(','));
    lines.push(
      [mediaSummary.name, mediaSummary.duration ?? '-', mediaSummary.totalExibicoes]
        .map((v) => csvEscape(String(v)))
        .join(',')
    );
    lines.push('');
    lines.push(['Ponto de Exibição', 'Total de Exibições'].join(','));
    deviceRows.forEach((d) => {
      lines.push([d.deviceName, d.totalExibicoes].map((v) => csvEscape(String(v))).join(','));
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${mediaSummary.name}-${startDate}-a-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 print:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">RELATÓRIO</h1>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={16} /> Imprimir Relatório
          </button>
          {mediaSummary && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <Download size={16} /> Salvar CSV
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-600 text-white text-xs font-semibold px-3 py-2 uppercase">Mídia</div>
          <div className="p-3 flex gap-2">
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              {playlists.length === 0 && <option value="">Nenhuma playlist</option>}
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={handleVisualizar}
              disabled={!selectedPlaylistId || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Eye size={14} /> Visualizar
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-600 text-white text-xs font-semibold px-3 py-2 uppercase text-center">Data Inicial</div>
          <div className="p-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-blue-600"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-600 text-white text-xs font-semibold px-3 py-2 uppercase text-center">Data Final</div>
          <div className="p-3">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-blue-600"
            />
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}

      {!loading && hasSearched && mediaSummary && (
        <>
          {/* Tabela: Mídia / Duração / Total de Exibições */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-600 text-white text-xs uppercase">
                  <th className="text-left px-3 py-2 font-semibold">Mídia</th>
                  <th className="text-center px-3 py-2 font-semibold">Duração</th>
                  <th className="text-center px-3 py-2 font-semibold">Total de Exibições</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 text-gray-700">{mediaSummary.name}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{mediaSummary.duration ?? '—'}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{mediaSummary.totalExibicoes}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabela: Pontos de Exibição */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-600 text-white text-xs uppercase">
                  <th className="text-left px-3 py-2 font-semibold">Pontos de Exibição</th>
                  <th className="text-center px-3 py-2 font-semibold">Total de Exibições</th>
                </tr>
              </thead>
              <tbody>
                {deviceRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-center text-gray-400">
                      Nenhuma exibição registrada nesse período.
                    </td>
                  </tr>
                ) : (
                  deviceRows.map((d, i) => (
                    <tr key={d.deviceId} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-3 py-2 text-gray-700">{d.deviceName}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{d.totalExibicoes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
