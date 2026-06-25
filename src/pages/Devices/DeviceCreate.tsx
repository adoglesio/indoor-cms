// cms/src/pages/Devices/DeviceCreate.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export function DeviceCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false); // ← controle de envio
  const [form, setForm] = useState({
    name: '',
    sector: '',
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    pairing_code: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evita múltiplos envios
    if (isSubmitting.current) return;

    if (!form.name.trim()) {
      alert('O nome da TV é obrigatório.');
      return;
    }

    setLoading(true);
    isSubmitting.current = true;

    try {
      const payload = {
        name: form.name.trim(),
        sector: form.sector?.trim() || null,
        orientation: form.orientation,
        status: 'offline',
        pairing_code: form.pairing_code?.trim() || null,
        last_seen_at: new Date().toISOString(),
        is_paired: false,
        owner_id: user?.id || null,
      };

      const { error } = await supabase.from('devices').insert(payload);
      if (error) throw error;

      navigate('/devices');
    } catch (error: any) {
      console.error('❌ Erro ao criar TV:', error);
      alert('Erro ao criar TV: ' + error.message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova TV</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block font-medium text-gray-700">Nome da TV *</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: TV Entrada Principal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Setor/Área Específica</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Ex: Entrada, Balcão"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Orientação *</label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="radio"
                value="horizontal"
                checked={form.orientation === 'horizontal'}
                onChange={() => setForm({ ...form, orientation: 'horizontal' })}
              />
              <span>Horizontal (TV deitada - paisagem)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="radio"
                value="vertical"
                checked={form.orientation === 'vertical'}
                onChange={() => setForm({ ...form, orientation: 'vertical' })}
              />
              <span>Vertical (TV em pé - retrato)</span>
            </label>
          </div>
        </div>

        <div>
          <p className="font-medium text-gray-700">Status atual:</p>
          <span className="inline-block mt-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Offline</span>
          <p className="text-xs text-gray-500 mt-1">O status será atualizado automaticamente quando a TV se conectar.</p>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Código de pareamento</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Digite o código exibido na TV"
              value={form.pairing_code}
              onChange={(e) => setForm({ ...form, pairing_code: e.target.value })}
            />
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => alert('Instruções de pareamento: \n1. Na TV, acesse Configurações > Pareamento.\n2. Digite o código gerado no campo acima.\n3. Clique em Salvar TV.')}
            >
              Como parear? ▼
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            <span>○ ○ ○ ○ ○ ○</span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Descrição/Notas</label>
          <textarea
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
            rows={3}
            placeholder="Informações adicionais sobre a TV..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/devices')}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar TV'}
          </button>
        </div>
      </form>
    </div>
  );
}