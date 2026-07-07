// src/pages/Admin/Users.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Building, Edit2, Save, X, RefreshCw, Search, Tv } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  company_name: string;
  phone: string;
  plan_type: string;
  points_included: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDeviceCounts();

    // 🔥 Sincronização em tempo real (Realtime)
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('🔄 Perfil atualizado, recarregando...');
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_profiles_with_email');
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários:', error);
      alert('Erro ao carregar lista de usuários: ' + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Quantas TVs cada usuário já tem cadastradas (pra comparar com o limite do plano)
  async function fetchDeviceCounts() {
    const { data, error } = await supabase
      .from('devices')
      .select('owner_id')
      .is('deleted_at', null);
    if (error) {
      console.error('❌ Erro ao contar TVs por usuário:', error);
      return;
    }
    const counts: Record<string, number> = {};
    (data || []).forEach((d: any) => {
      if (d.owner_id) counts[d.owner_id] = (counts[d.owner_id] || 0) + 1;
    });
    setDeviceCounts(counts);
  }

  const filteredUsers = users.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.company_name || '').toLowerCase().includes(q)
    );
  });

  const handleEdit = (profile: Profile) => {
    setEditing(profile.id);
    setEditForm({
      full_name: profile.full_name,
      company_name: profile.company_name,
      phone: profile.phone || '',
      plan_type: profile.plan_type,
      points_included: profile.points_included,
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          company_name: editForm.company_name,
          phone: editForm.phone,
          plan_type: editForm.plan_type,
          points_included: editForm.points_included,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      alert('✅ Usuário atualizado com sucesso!');
      setEditing(null);
      await fetchUsers();
    } catch (error: any) {
      alert('❌ Erro ao atualizar: ' + error.message);
    }
  };

  const getPlanLabel = (planType: string) => {
    const plans: Record<string, string> = {
      free: 'Grátis',
      pro: 'Pro',
      premium: 'Premium',
      enterprise: 'Empresarial',
    };
    return plans[planType] || planType;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
          <p className="text-sm text-gray-500">Visualize e edite os perfis dos usuários</p>
        </div>
        <button
          onClick={() => { fetchUsers(); fetchDeviceCounts(); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 transition"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou empresa..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {users.length === 0 ? 'Nenhum usuário cadastrado.' : 'Nenhum usuário encontrado para essa busca.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      {editing === profile.id ? (
                        <input
                          type="text"
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 w-full focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-800">
                          <User size={16} className="text-gray-400" />
                          {profile.full_name || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail size={16} className="text-gray-400" />
                        {profile.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editing === profile.id ? (
                        <input
                          type="text"
                          value={editForm.company_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 w-full focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building size={16} className="text-gray-400" />
                          {profile.company_name || '—'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === profile.id ? (
                        <select
                          value={editForm.plan_type || 'free'}
                          onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 w-full focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="free">Grátis (3 TVs)</option>
                          <option value="pro">Pro (5 TVs)</option>
                          <option value="premium">Premium (10 TVs)</option>
                          <option value="enterprise">Empresarial (Ilimitado)</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.plan_type === 'free' ? 'bg-gray-100 text-gray-700' :
                          profile.plan_type === 'pro' ? 'bg-blue-100 text-blue-700' :
                          profile.plan_type === 'premium' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {getPlanLabel(profile.plan_type)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {(() => {
                        const used = deviceCounts[profile.user_id] || 0;
                        const limit = profile.points_included || 0;
                        const overLimit = limit > 0 && used > limit;
                        return (
                          <span className={`flex items-center gap-1 font-medium ${overLimit ? 'text-red-600' : ''}`}>
                            <Tv size={14} className="text-gray-400" />
                            {used} / {limit}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {editing === profile.id ? (
                        <input
                          type="number"
                          min="0"
                          value={editForm.points_included || 0}
                          onChange={(e) => setEditForm({ ...editForm, points_included: parseInt(e.target.value) || 0 })}
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-800 w-20 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-medium">{profile.points_included || 0}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing === profile.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(profile.id)}
                            className="text-green-600 hover:text-green-700 transition"
                            title="Salvar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700 transition"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(profile)}
                          className="text-blue-600 hover:text-blue-700 transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}