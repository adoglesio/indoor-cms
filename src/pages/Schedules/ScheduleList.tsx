import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Calendar, Filter, X, Edit, Repeat, Trash2, Clock } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns/esm'; // ← versão ES Modules
import ptBR from 'date-fns/locale/pt-BR';

const { format, startOfWeek, addDays, isSameDay } = require('date-fns');
const ptBR = require('date-fns/locale/pt-BR');

interface Schedule {
  id: string;
  name: string;
  description: string | null;
  device_id: string | null;
  playlist_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  device_name?: string;
  playlist_name?: string;
}

export function ScheduleList() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        devices ( name ),
        playlists ( name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error);
      setSchedules([]);
    } else {
      const mapped = (data || []).map((item: any) => ({
        ...item,
        device_name: item.devices?.name || 'Todas as TVs',
        playlist_name: item.playlists?.name || 'Nenhuma',
      }));
      setSchedules(mapped);
    }
    setLoading(false);
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('schedules')
      .update({ is_active: !current, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) alert('Erro ao alterar status: ' + error.message);
    else fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este agendamento?')) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) alert('Erro: ' + error.message);
    else fetchSchedules();
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agendamento</h1>
        <Link
          to="/schedules/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          + Novo Agendamento
        </Link>
      </div>

      {/* Filtros e barra de navegação */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex-1 min-w-[150px]">
          <select className="w-full border p-2 rounded">
            <option>Todas as TVs (2)</option>
          </select>
        </div>
        <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2">
          <Filter size={16} /> Status
        </button>
        <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2">
          <X size={16} /> Limpar
        </button>
      </div>

      {/* Calendário semanal */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">
            {format(selectedDate, "MMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 7)))}
              className="px-3 py-1 border rounded"
            >
              &lt;
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 border rounded"
            >
              Hoje
            </button>
            <button
              onClick={() => setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 7)))}
              className="px-3 py-1 border rounded"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 rounded cursor-pointer hover:bg-blue-50 ${
                isSameDay(day, new Date()) ? 'bg-blue-100 font-bold' : ''
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-xs text-gray-500">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-lg">{format(day, 'd')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 text-sm">
        <span><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span> TESTE HORIZONTAL</span>
        <span><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> TESTE VERTICAL</span>
      </div>

      {/* Lista de agendamentos */}
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum agendamento criado.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conteúdo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repetição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      {s.start_date ? format(new Date(s.start_date), 'dd/MM/yyyy HH:mm') : '—'}
                      {s.end_date && ` - ${format(new Date(s.end_date), 'HH:mm')}`}
                    </td>
                    <td className="px-4 py-3">{s.playlist_name}</td>
                    <td className="px-4 py-3">{s.device_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {s.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">Não repetir</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/schedules/${s.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                        <button onClick={() => toggleActive(s.id, s.is_active)} className="text-yellow-600 hover:underline">
                          {s.is_active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-sm text-gray-600 border-t">
            Mostrando 1 - {schedules.length} de {schedules.length} agendamentos
          </div>
        </div>
      )}
    </div>
  );
}