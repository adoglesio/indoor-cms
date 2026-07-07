// src/pages/Devices/DeviceCreate.tsx
import { useState, useRef, useEffect } from 'react';
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
  const [userPlanLimit, setUserPlanLimit] = useState<number | null>(null);
  const [devicesCount, setDevicesCount] = useState(0);

  const [form, setForm] = useState({
    name: '',
    sector: '',
    orientation: 'horizontal' as 'horizontal' | 'vertical',
    pairing_code: '',
    description: '',
  });

  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('points_included')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setUserPlanLimit(profile.points_included || 3);
      }

      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('owner_id', user.id); // 🔥 FILTRO POR USUÁRIO

      setDevicesCount(count || 0);
    };

    fetchPlanInfo();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    if (!form.name.trim()) {
      alert('O nome da TV é obrigatório.');
      return;
    }

    if (userPlanLimit !== null && devicesCount >= userPlanLimit) {
      alert(`❌ Limite do plano atingido! Você já possui ${devicesCount} TV(s) de ${userPlanLimit} permitidas.`);
      return;
    }

    setLoading(true);
    isSubmitting.current = true;

    try {
      let pairingCode = form.pairing_code.trim();
      let isPaired = false;
      let status = 'offline';

      if (pairingCode) {
        isPaired = true;
        status = 'online';
      } else {
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
        isPaired = false;
        status = 'offline';
      }

      const payload = {
        name: form.name.trim(),
        sector: form.sector?.trim() || null,
        orientation: form.orientation,
        status,
        pairing_code: pairingCode,
        last_seen_at: isPaired ? new Date().toISOString() : null,
        is_paired: isPaired,
        owner_id: user?.id || null, // 🔥 VINCULA AO USUÁRIO
        updated_at: new Date().toISOString(),
      };

      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id, is_paired, owner_id')
        .eq('pairing_code', pairingCode)
        .maybeSingle();

      // Só reaproveita a TV existente se ela for sua (ou ainda não tiver dono).
      // Nunca deixa "sequestrar" silenciosamente uma TV de outro usuário.
      if (existingDevice && existingDevice.owner_id && existingDevice.owner_id !== user?.id) {
        alert('❌ Esse código de pareamento já está em uso por uma TV de outro usuário. Escolha outro código (ou deixe em branco para gerar um automaticamente).');
        return;
      }

      if (existingDevice) {
        const { data: updatedRows, error } = await supabase
          .from('devices')
          .update({
            name: payload.name,
            sector: payload.sector,
            orientation: payload.orientation,
            owner_id: payload.owner_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDevice.id)
          .select();
        if (error) throw error;
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error('A TV não foi atualizada (bloqueio de permissão no banco). Verifique as políticas de RLS da tabela "devices".');
        }
        alert(`TV atualizada com sucesso! Código: ${pairingCode}`);
      } else {
        const { data: insertedRows, error } = await supabase
          .from('devices')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select();
        if (error) {
          if (error.code === '23505') {
            alert('Este código já está em uso. Tente outro.');
          } else {
            throw error;
          }
          return;
        }
        if (!insertedRows || insertedRows.length === 0) {
          throw new Error('A TV não foi criada (bloqueio de permissão no banco). Verifique as políticas de RLS da tabela "devices".');
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova TV</h1>
      {userPlanLimit !== null && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-gray-300">
          📺 Você possui <span className="text-blue-300 font-bold">{devicesCount}</span> de{' '}
          <span className="text-blue-300 font-bold">{userPlanLimit}</span> TVs disponíveis.
          {devicesCount >= userPlanLimit && (
            <span className="block text-yellow-300 mt-1">⚠️ Limite atingido! Não é possível adicionar mais TVs.</span>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
        {/* Campos do formulário (mesmo código) */}
        <div>
          <label className="block font-medium text-gray-300">Nome da TV *</label>
          <input
            type="text"
            className="mt-1 w-full border border-white/10 rounded-xl px-4 py-3 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: TV Entrada Principal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block font-medium text-gray-300">Setor/Área Específica</label>
          <input
            type="text"
            className="mt-1 w-full border border-white/10 rounded-xl px-4 py-3 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Entrada, Balcão"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-300">Orientação *</label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-3 text-gray-300">
              <input
                type="radio"
                value="horizontal"
                checked={form.orientation === 'horizontal'}
                onChange={() => setForm({ ...form, orientation: 'horizontal' })}
              />
              <span>Horizontal (TV deitada - paisagem)</span>
            </label>
            <label className="flex items-center gap-3 text-gray-300">
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
          <label className="block font-medium text-gray-300">Código de pareamento</label>
          <input
            type="text"
            className="mt-1 w-full border border-white/10 rounded-xl px-4 py-3 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            placeholder="Deixe em branco para gerar automaticamente"
            value={form.pairing_code}
            onChange={(e) => setForm({ ...form, pairing_code: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            Se preenchido, a TV será pareada automaticamente ao ser criada.
            Se deixar em branco, um código será gerado e a TV ficará aguardando pareamento.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/devices')} className="px-5 py-2 border border-white/10 rounded-xl text-gray-300 hover:bg-white/5">Cancelar</button>
          <button type="submit" disabled={loading || (userPlanLimit !== null && devicesCount >= userPlanLimit)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}