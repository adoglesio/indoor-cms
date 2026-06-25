// src/pages/Schedules/ScheduleForm.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

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

  const [form, setForm] = useState({
    name: '',
    description: '',
    device_id: '',
    playlist_id: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [rules, setRules] = useState<Rule[]>([]);

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
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        is_active: data.is_active ?? true,
      });
      // Buscar regras
      const { data: rulesData } = await supabase
        .from('schedule_rules')
        .select('*')
        .eq('schedule_id', id)
        .order('priority', { ascending: true });
      setRules(rulesData || []);
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        device_id: form.device_id || null,
        playlist_id: form.playlist_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
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

      // Gerenciar regras (substituir todas)
      if (scheduleId) {
        // Remover regras antigas
        await supabase.from('schedule_rules').delete().eq('schedule_id', scheduleId);
        // Inserir novas
        if (rules.length > 0) {
          const rulesToInsert = rules.map((rule) => ({
            schedule_id: scheduleId,
            rule_type: rule.rule_type,
            rule_params: rule.rule_params,
            priority: rule.priority,
          }));
          const { error: rulesError } = await supabase.from('schedule_rules').insert(rulesToInsert);
          if (rulesError) throw rulesError;
        }
      }

      navigate('/schedules');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Editar Agendamento' : 'Novo Agendamento'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block font-medium">Nome *</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block font-medium">Descrição</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">TV</label>
            <select
              className="w-full border p-2 rounded"
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            >
              <option value="">Todas as TVs</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Playlist</label>
            <select
              className="w-full border p-2 rounded"
              value={form.playlist_id}
              onChange={(e) => setForm({ ...form, playlist_id: e.target.value })}
            >
              <option value="">Nenhuma</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Data Início</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium">Data Fim</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label>Ativo</label>
        </div>

        <hr />
        <h2 className="font-bold text-lg">Regras de Exibição</h2>
        <button type="button" onClick={addRule} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">
          + Adicionar Regra
        </button>

        {rules.map((rule, index) => (
          <div key={index} className="border p-4 rounded relative">
            <button type="button" onClick={() => removeRule(index)} className="absolute top-2 right-2 text-red-500">✕</button>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Tipo</label>
                <select
                  className="w-full border p-1 rounded"
                  value={rule.rule_type}
                  onChange={(e) => updateRule(index, 'rule_type', e.target.value)}
                >
                  <option value="time">Horário (Dayparting)</option>
                  <option value="weather">Clima / Gatilho Externo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Prioridade</label>
                <input
                  type="number"
                  className="w-full border p-1 rounded"
                  value={rule.priority}
                  onChange={(e) => updateRule(index, 'priority', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            {rule.rule_type === 'time' && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm">Início</label>
                  <input
                    type="time"
                    className="w-full border p-1 rounded"
                    value={rule.rule_params?.start || ''}
                    onChange={(e) => updateRule(index, 'rule_params', { ...rule.rule_params, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm">Fim</label>
                  <input
                    type="time"
                    className="w-full border p-1 rounded"
                    value={rule.rule_params?.end || ''}
                    onChange={(e) => updateRule(index, 'rule_params', { ...rule.rule_params, end: e.target.value })}
                  />
                </div>
              </div>
            )}
            {rule.rule_type === 'weather' && (
              <div className="mt-2">
                <label className="block text-sm">Temperatura (°C)</label>
                <input
                  type="number"
                  className="w-full border p-1 rounded"
                  value={rule.rule_params?.temperature_gt || ''}
                  onChange={(e) => updateRule(index, 'rule_params', { temperature_gt: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500">Ex: exibir esta playlist quando temperatura externa for maior que 30°C</p>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/schedules')} className="px-4 py-2 border rounded">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}