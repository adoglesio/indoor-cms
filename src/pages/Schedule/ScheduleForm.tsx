// src/pages/Schedules/ScheduleForm.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export function ScheduleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

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
    recurrence: 'none',
    days_of_week: [],
  });

  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

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
    const { data } = await supabase.from('schedules').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        description: data.description || '',
        device_id: data.device_id || '',
        playlist_id: data.playlist_id || '',
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        is_active: data.is_active ?? true,
        recurrence: data.recurrence || 'none',
        days_of_week: data.days_of_week || [],
      });
      setDaysOfWeek(data.days_of_week || []);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (!form.playlist_id) {
      alert('Selecione uma playlist');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        device_id: form.device_id || null,
        playlist_id: form.playlist_id,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        is_active: form.is_active,
        recurrence: form.recurrence || 'none',
        days_of_week: form.recurrence === 'weekly' ? daysOfWeek : null,
        updated_at: new Date().toISOString(),
        owner_id: user?.id || null,
      };

      if (id) {
        const { error } = await supabase.from('schedules').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedules').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
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
          <label className="block font-medium">Nome</label>
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
            <label className="block font-medium">Playlist</label>
            <select
              className="w-full border p-2 rounded"
              value={form.playlist_id}
              onChange={(e) => setForm({ ...form, playlist_id: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">TV</label>
            <select
              className="w-full border p-2 rounded"
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            >
              <option value="">Todas</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Data Início</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium">Data Fim</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium">Hora Início</label>
            <input
              type="time"
              className="w-full border p-2 rounded"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-medium">Hora Fim</label>
            <input
              type="time"
              className="w-full border p-2 rounded"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Recorrência</label>
          <select
            className="w-full border p-2 rounded"
            value={form.recurrence}
            onChange={(e) => {
              setForm({ ...form, recurrence: e.target.value });
              if (e.target.value !== 'weekly') setDaysOfWeek([]);
            }}
          >
            <option value="none">Não repetir</option>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        {form.recurrence === 'weekly' && (
          <div>
            <label className="block font-medium">Dias da semana</label>
            <div className="flex flex-wrap gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label, idx) => (
                <label key={idx} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={daysOfWeek.includes(idx)}
                    onChange={(e) => {
                      if (e.target.checked) setDaysOfWeek([...daysOfWeek, idx]);
                      else setDaysOfWeek(daysOfWeek.filter(d => d !== idx));
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <label>Ativo</label>
        </div>
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