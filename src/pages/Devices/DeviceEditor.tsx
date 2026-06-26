import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export function DeviceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    sector: '',
    orientation: 'horizontal',
    pairing_code: '',
    security_key: '',
    is_paired: false,
    resolution: '1080p',
    app_version: '1.0.0',
    active_playlist_id: '',
  });

  useEffect(() => {
    if (id) fetchDevice();
    fetchPlaylists();
  }, [id]);

  async function fetchDevice() {
    const { data } = await supabase.from('devices').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        sector: data.sector || '',
        orientation: data.orientation || 'horizontal',
        pairing_code: data.pairing_code || '',
        security_key: data.security_key || '',
        is_paired: data.is_paired || false,
        resolution: data.resolution || '1080p',
        app_version: data.app_version || '1.0.0',
        active_playlist_id: data.active_playlist_id || '',
      });
    }
  }

  async function fetchPlaylists() {
    const { data } = await supabase.from('playlists').select('id, name').order('name');
    setPlaylists(data || []);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting.current) {
      console.warn('⚠️ Envio bloqueado (já em andamento)');
      return;
    }

    if (!form.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);
    isSubmitting.current = true;

    try {
      const isPaired = form.is_paired || !!form.pairing_code.trim();
      const securityKey = form.security_key.trim() || crypto.randomUUID();

      const payload: any = {
        name: form.name.trim(),
        sector: form.sector || null,
        orientation: form.orientation,
        pairing_code: form.pairing_code || null,
        security_key: securityKey,
        is_paired: isPaired,
        resolution: form.resolution,
        app_version: form.app_version,
        active_playlist_id: form.active_playlist_id || null,
        updated_at: new Date().toISOString(),
      };

      if (isPaired) {
        payload.status = 'online';
        payload.last_seen_at = new Date().toISOString();
      }

      if (id) {
        const { error } = await supabase.from('devices').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('devices').insert({
          ...payload,
          created_at: new Date().toISOString(),
          status: 'offline',
          last_seen_at: new Date().toISOString(),
        });
        if (error) {
          if (error.message?.includes('unique_pairing_code') || error.code === '23505') {
            alert('Este código de pareamento já está em uso. Gere um novo código no Player.');
          } else {
            throw error;
          }
          return;
        }
      }

      navigate('/devices');
    } catch (error: any) {
      if (error.message?.includes('unique_pairing_code') || error.code === '23505') {
        alert('Este código de pareamento já está em uso. Gere um novo código no Player.');
      } else {
        alert('Erro: ' + error.message);
      }
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Editar TV' : 'Nova TV'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block font-medium">Nome da TV *</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block font-medium">Setor/Área</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium">Orientação *</label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                value="horizontal"
                checked={form.orientation === 'horizontal'}
                onChange={() => setForm({ ...form, orientation: 'horizontal' })}
              /> Horizontal
            </label>
            <label>
              <input
                type="radio"
                value="vertical"
                checked={form.orientation === 'vertical'}
                onChange={() => setForm({ ...form, orientation: 'vertical' })}
              /> Vertical
            </label>
          </div>
        </div>

        <div>
          <label className="block font-medium">Playlist Ativa</label>
          <select
            className="w-full border p-2 rounded"
            value={form.active_playlist_id}
            onChange={(e) => setForm({ ...form, active_playlist_id: e.target.value })}
          >
            <option value="">Nenhuma</option>
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Código de pareamento</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Digite o código exibido na TV"
            value={form.pairing_code}
            onChange={(e) => setForm({ ...form, pairing_code: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Preencha com o código de 6 dígitos gerado pelo Player para parear automaticamente.
          </p>
        </div>

        <div>
          <label className="block font-medium">Chave de Segurança</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Gerado automaticamente"
            value={form.security_key}
            onChange={(e) => setForm({ ...form, security_key: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium">Resolução</label>
          <select
            className="w-full border p-2 rounded"
            value={form.resolution}
            onChange={(e) => setForm({ ...form, resolution: e.target.value })}
          >
            <option value="1080p">1080p</option>
            <option value="4K">4K</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Versão do App</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={form.app_version}
            onChange={(e) => setForm({ ...form, app_version: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_paired}
            onChange={(e) => setForm({ ...form, is_paired: e.target.checked })}
          />
          <label>Pareado</label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/devices')} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={loading}>
            {loading ? 'Salvando...' : id ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}