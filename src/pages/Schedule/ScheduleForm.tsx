
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Plus, X } from 'lucide-react';

interface Device {
  id: string;
  name: string;
}

interface Playlist {
  id: string;
  name: string;
}

interface Rule {
  id?: string;
  rule_type: 'time' | 'weather';
  rule_params: any;
  priority: number;
}

export function ScheduleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [startMode, setStartMode] = useState<'schedule' | 'now'>('schedule');

  const [form, setForm] = useState({
    name: '',
    description: '',
    device_id: '',
    playlist_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_active: true,
    recurrence: 'none', // valor padrão para ENUM
  });

  const [rules, setRules] = useState<Rule[]>([]);

  // ============================================================
  // 1. CARREGAR DADOS INICIAIS
  // ============================================================
  useEffect(() => {
    fetchDevices();
    fetchPlaylists();
    if (id) fetchSchedule();
  }, [id]);

  async function fetchDevices() {
    const { data } = await supabase.from('devices').select('id, name').order('name');
    setDevices(data || []);
  }

  async function fetchPlaylists() {
    const { data } = await supabase.from('playlists').select('id, name').order('name');
    setPlaylists(data || []);
  }

  async function fetchSchedule() {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Erro ao buscar agendamento:', error);
      return;
    }
    if (data) {
      setForm({
        name: data.name || '',
        description: data.description || '',
        device_id: data.device_id || '',
        playlist_id: data.playlist_id || '',
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        start_time: data.start_date ? new Date(data.start_date).toTimeString().slice(0, 5) : '',
        end_time: data.end_date ? new Date(data.end_date).toTimeString().slice(0, 5) : '',
        is_active: data.is_active ?? true,
        recurrence: data.recurrence || 'none',
      });
      const { data: rulesData } = await supabase
        .from('schedule_rules')
        .select('*')
        .eq('schedule_id', id)
        .order('priority', { ascending: true });
      setRules(rulesData || []);
    }
  }

  // ============================================================
  // 2. REGRAS
  // ============================================================
  const addRule = () => {
    setRules([...rules, { rule_type: 'time', rule_params: { start: '08:00', end: '18:00' }, priority: rules.length + 1 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  // ============================================================
  // 3. SUBMIT
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (!form.playlist_id) {
      alert('Selecione uma playlist');
      return;
    }

    // Montar data/hora
    let startDateTime = null;
    let endDateTime = null;

    if (startMode === 'now') {
      const now = new Date();
      startDateTime = now.toISOString();
      if (form.end_date || form.end_time) {
        const endDate = form.end_date ? new Date(form.end_date) : new Date(now);
        if (form.end_time) {
          const [h, m] = form.end_time.split(':').map(Number);
          endDate.setHours(h, m);
        } else {
          endDate.setHours(now.getHours() + 1);
        }
        endDateTime = endDate.toISOString();
      }
    } else {
      if (form.start_date && form.start_time) {
        startDateTime = new Date(`${form.start_date}T${form.start_time}`).toISOString();
      }
      if (form.end_date && form.end_time) {
        endDateTime = new Date(`${form.end_date}T${form.end_time}`).toISOString();
      }
    }

    // Validação para start_date (NOT NULL)
    if (!startDateTime) {
      alert('Data e hora de início são obrigatórias.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        device_id: form.device_id || null,
        playlist_id: form.playlist_id,
        start_date: startDateTime,
        end_date: endDateTime || null,
        is_active: form.is_active,
        recurrence: form.recurrence || 'none', // ENUM obrigatório
        owner_id: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      let scheduleId = id;

      if (id) {
        const { error } = await supabase.from('schedules').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('schedules')
          .insert({ ...payload, created_at: new Date().toISOString() })
          .select('id')
          .single();
        if (error) throw error;
        scheduleId = data.id;
      }

      // Gerenciar regras (opcional)
      if (scheduleId && rules.length > 0) {
        await supabase.from('schedule_rules').delete().eq('schedule_id', scheduleId);
        const rulesToInsert = rules.map((rule) => ({
          schedule_id: scheduleId,
          rule_type: rule.rule_type,
          rule_params: rule.rule_params,
          priority: rule.priority,
        }));
        const { error: rulesError } = await supabase.from('schedule_rules').insert(rulesToInsert);
        if (rulesError) throw rulesError;
      }

      navigate('/schedules');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 4. RENDER
  // ============================================================
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Editar Agendamento' : 'Novo Agendamento'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">

        {/* Nome */}
        <div>
          <label className="block font-medium text-gray-700">Nome do Agendamento *</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Promoção de Fim de Semana"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block font-medium text-gray-700">Observações sobre este agendamento</label>
          <textarea
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Informações adicionais sobre o agendamento..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Playlist e TVs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-gray-700">Playlist *</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.playlist_id}
              onChange={(e) => setForm({ ...form, playlist_id: e.target.value })}
              required
            >
              <option value="">Selecione uma playlist</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700">TVs de Destino</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            >
              <option value="">Todas as TVs</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Modo de início */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700 mb-3">Como deseja iniciar?</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="schedule"
                checked={startMode === 'schedule'}
                onChange={() => setStartMode('schedule')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">Agendar</span>
              <span className="text-sm text-gray-500">Defina manualmente a data e a hora</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="now"
                checked={startMode === 'now'}
                onChange={() => setStartMode('now')}
                className="w-4 h-4 text-green-600"
              />
              <span className="font-medium">Iniciar agora</span>
              <span className="text-sm text-gray-500">Inicia imediatamente</span>
            </label>
          </div>
        </div>

        {/* Datas e Horários (modo agendar) */}
        {startMode === 'schedule' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700">Data de Início</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Data de Fim</label>
              <input
                type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Hora de Início</label>
              <input
                type="time"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700">Hora de Fim</label>
              <input
                type="time"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
        )}

        {startMode === 'now' && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <Play className="inline w-4 h-4 mr-2" />
            O agendamento será iniciado imediatamente após a criação.
          </div>
        )}

        {/* Recorrência */}
        <div>
          <label className="block font-medium text-gray-700">Recorrência</label>
          <select
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={form.recurrence}
            onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
          >
            <option value="none">Não repetir</option>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>

        {/* Regras de Exibição */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-700">Regras de Exibição</h2>
            <button
              type="button"
              onClick={addRule}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={16} /> Adicionar Regra
            </button>
          </div>

          {rules.map((rule, index) => (
            <div key={index} className="border p-4 rounded-lg mb-3 relative bg-gray-50">
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                    value={rule.rule_type}
                    onChange={(e) => updateRule(index, 'rule_type', e.target.value)}
                  >
                    <option value="time">⏰ Horário (Dayparting)</option>
                    <option value="weather">🌦️ Clima / Gatilho Externo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                    value={rule.priority}
                    onChange={(e) => updateRule(index, 'priority', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              {rule.rule_type === 'time' && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm text-gray-600">Início</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                      value={rule.rule_params?.start || ''}
                      onChange={(e) => updateRule(index, 'rule_params', { ...rule.rule_params, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Fim</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                      value={rule.rule_params?.end || ''}
                      onChange={(e) => updateRule(index, 'rule_params', { ...rule.rule_params, end: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {rule.rule_type === 'weather' && (
                <div className="mt-2">
                  <label className="block text-sm text-gray-600">Temperatura (°C)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                    placeholder="Ex: 30"
                    value={rule.rule_params?.temperature_gt || ''}
                    onChange={(e) => updateRule(index, 'rule_params', { temperature_gt: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    🌡️ Exibir quando temperatura externa for maior que o valor informado.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Status ativo */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="isActive" className="font-medium text-gray-700">Agendamento ativo</label>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Agendamento'}
          </button>
        </div>
      </form>
    </div>
  );
}