// cms/src/pages/Devices/DeviceCreate.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const generateNumericCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function DeviceCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);
  const [form, setForm] = useState({
    name: '',
    sector: '',
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    pairing_code: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    if (!form.name.trim()) {
      alert('O nome da TV é obrigatório.');
      return;
    }

    setLoading(true);
    isSubmitting.current = true;

    try {
      let pairingCode = form.pairing_code.trim();
      if (!pairingCode) {
        // Se não forneceu, gera automático
        let newCode = generateNumericCode();
        let attempts = 0;
        while (attempts < 10) {
          const { data: existing } = await supabase
            .from('devices')
            .select('id')
            .eq('pairing_code', newCode)
            .maybeSingle();
          if (!existing) break;
          newCode = generateNumericCode();
          attempts++;
        }
        pairingCode = newCode;
      }

      const payload = {
        name: form.name.trim(),
        sector: form.sector?.trim() || null,
        orientation: form.orientation,
        status: 'offline',
        pairing_code: pairingCode,
        last_seen_at: new Date().toISOString(),
        is_paired: false,
        owner_id: user?.id || null,
      };

      // Verifica se o código já existe (para reutilizar)
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('pairing_code', pairingCode)
        .maybeSingle();

      if (existingDevice) {
        // Se já existe, atualiza os dados (nome, setor, etc.) em vez de inserir
        const { error } = await supabase
          .from('devices')
          .update({
            name: payload.name,
            sector: payload.sector,
            orientation: payload.orientation,
            owner_id: payload.owner_id,
          })
          .eq('id', existingDevice.id);
        if (error) throw error;
        alert(`TV atualizada com sucesso! Código: ${pairingCode}`);
      } else {
        // Insere novo
        const { error } = await supabase.from('devices').insert(payload);
        if (error) {
          if (error.code === '23505') {
            alert('Este código já está em uso. Tente outro.');
          } else {
            throw error;
          }
          return;
        }
        alert(`TV criada com sucesso! Código: ${pairingCode}`);
      }

      navigate('/devices');
    } catch (error: any) {
      console.error('❌ Erro:', error);
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  // ... (restante do componente com o formulário, igual ao que você já tem)
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova TV</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow">
        {/* ... campos existentes ... */}
        <div>
          <label className="block font-medium text-gray-700">Código de pareamento</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Deixe em branco para gerar automaticamente"
            value={form.pairing_code}
            onChange={(e) => setForm({ ...form, pairing_code: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Insira o código exibido no Player para parear com uma TV existente.
          </p>
        </div>
        {/* ... resto do formulário ... */}
      </form>
    </div>
  );
}