// src/pages/Profile/Profile.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { User, Building, Mail, Lock, Edit2, Save, X, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
// @ts-ignore
import 'react-toastify/dist/ReactToastify.css';

interface ProfileData {
  full_name: string;
  company_name: string;
  email: string;
  avatar_url: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    company_name: '',
    email: user?.email || '',
    avatar_url: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name, avatar_url')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile((prev) => ({
          ...prev,
          full_name: data.full_name || '',
          company_name: data.company_name || '',
          avatar_url: data.avatar_url || '',
        }));
      }
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  // ------------------------------------------------------------
  // AVATAR: upload de uma foto, salva em Storage + tabela profiles
  // ------------------------------------------------------------
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (jpg, png, etc).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      // Sempre o mesmo nome (sobrescreve) — evita acumular fotos antigas do mesmo usuário.
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      // Adiciona um carimbo de tempo na URL só pra forçar o navegador a não usar a imagem antiga em cache.
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { user_id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (profileError) throw profileError;

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success('Foto de perfil atualizada!');
    } catch (error: any) {
      toast.error('Erro ao enviar a foto: ' + error.message);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Atualizar metadados do usuário
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: profile.full_name },
      });
      if (authError) throw authError;

      // 2. Usar upsert com onConflict
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          full_name: profile.full_name,
          company_name: profile.company_name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      toast.success('Perfil atualizado com sucesso!');
      setEditing(false);
      await fetchProfile();
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Confere a senha atual de verdade antes de trocar (reautentica).
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword,
      });
      if (signInError) {
        toast.error('Senha atual incorreta.');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      if (error) throw error;

      toast.success('Senha alterada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // E-MAIL / USUÁRIO: o e-mail é o login. Trocar exige confirmação
  // (o Supabase manda um link de confirmação pro e-mail novo).
  // ------------------------------------------------------------
  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Digite um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;

      toast.success('Enviamos um link de confirmação para o novo e-mail. Confirme para concluir a troca.');
      setShowEmailForm(false);
      setNewEmail('');
    } catch (error: any) {
      toast.error('Erro ao alterar e-mail: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie suas informações pessoais</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 md:p-8">
        <form onSubmit={handleUpdateProfile}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg relative group"
                  title="Trocar foto de perfil"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{profile.full_name || 'Usuário'}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:underline mt-0.5"
                >
                  Trocar foto
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" /> Nome Completo
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 rounded-lg border ${editing ? 'border-blue-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'} transition`}
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" /> Empresa
                </label>
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  disabled={!editing}
                  className={`w-full px-4 py-2 rounded-lg border ${editing ? 'border-blue-300 focus:ring-2 focus:ring-blue-500' : 'border-gray-200 bg-gray-50'} transition`}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" /> E-mail (login)
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pra trocar o e-mail de login, use o botão "Alterar E-mail" abaixo.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {!editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
                  >
                    <Edit2 className="w-4 h-4" /> Editar Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                  >
                    <Lock className="w-4 h-4" /> Alterar Senha
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                  >
                    <Mail className="w-4 h-4" /> Alterar E-mail
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </form>

        {showPasswordForm && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alterar Senha</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition disabled:opacity-50"
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {showEmailForm && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Alterar E-mail</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você vai receber um link de confirmação no e-mail novo. A troca só é concluída depois de clicar nesse link.
            </p>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Novo E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="novo@email.com"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Confirmação'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="px-5 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}