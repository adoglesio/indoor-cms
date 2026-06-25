// src/pages/Playlists/PlaylistForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface MediaAsset {
  id: string;
  file_name: string;
  media_type: 'image' | 'video';
}

export function PlaylistForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Campos da playlist
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [orientation, setOrientation] = useState('horizontal');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [type, setType] = useState<'media' | 'youtube'>('media');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Carregar dados para edição
  useEffect(() => {
    if (id) {
      fetchPlaylist();
    }
    fetchMedia();
  }, [id]);

  async function fetchPlaylist() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Erro ao buscar playlist:', error);
      return;
    }
    if (data) {
      setName(data.name || '');
      setDescription(data.description || '');
      setOrientation(data.orientation || 'horizontal');
      setAudioEnabled(data.audio_enabled || false);
      setType(data.type || 'media');
      setYoutubeUrl(data.youtube_url || '');
      // Carregar itens da playlist - CORRIGIDO: usa media_asset_id
      const { data: items } = await supabase
        .from('playlist_items')
        .select('media_asset_id')   // ← CORREÇÃO AQUI
        .eq('playlist_id', id)
        .order('position');
      if (items) {
        setSelectedMediaIds(items.map((item) => item.media_asset_id));
      }
    }
  }

  async function fetchMedia() {
    const { data, error } = await supabase
      .from('media_assets')
      .select('id, file_name, media_type')
      .order('file_name');
    if (error) {
      console.error('Erro ao buscar mídias:', error);
      return;
    }
    setMediaList(data || []);
  }

  const filteredMedia = mediaList.filter((m) =>
    m.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    if (type === 'youtube' && !youtubeUrl.trim()) {
      alert('URL do YouTube é obrigatória');
      return;
    }
    if (type === 'media' && selectedMediaIds.length === 0) {
      alert('Selecione pelo menos uma mídia');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim() || null,
        orientation,
        audio_enabled: audioEnabled,
        type,
        youtube_url: type === 'youtube' ? youtubeUrl.trim() : null,
        updated_at: new Date().toISOString(),
        owner_id: user?.id || null,
      };

      let playlistId = id;

      if (id) {
        // Editar
        const { error } = await supabase
          .from('playlists')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('playlists')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        playlistId = data.id;
      }

      // Se for tipo media, gerenciar os itens
      if (type === 'media') {
        // Remover itens antigos (se edição)
        if (id) {
          await supabase.from('playlist_items').delete().eq('playlist_id', id);
        }

        // Inserir novos itens - CORRIGIDO: usa media_asset_id
        if (selectedMediaIds.length > 0) {
          const items = selectedMediaIds.map((mediaId, index) => ({
            playlist_id: playlistId,
            media_asset_id: mediaId,   // ← CORREÇÃO AQUI
            position: index + 1,
            duration: 10,              // coluna duration existe
          }));
          const { error: itemsError } = await supabase
            .from('playlist_items')
            .insert(items);
          if (itemsError) throw itemsError;
        }
      }

      navigate('/playlists');
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Editar Playlist' : 'Nova Playlist'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        {/* Nome */}
        <div>
          <label className="block font-medium">Nome *</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block font-medium">Descrição</label>
          <textarea
            className="w-full border p-2 rounded"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Orientação */}
        <div>
          <label className="block font-medium">Orientação</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="horizontal"
                checked={orientation === 'horizontal'}
                onChange={() => setOrientation('horizontal')}
              />
              Horizontal
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="vertical"
                checked={orientation === 'vertical'}
                onChange={() => setOrientation('vertical')}
              />
              Vertical
            </label>
          </div>
        </div>

        {/* Áudio ativado */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="audioEnabled"
            checked={audioEnabled}
            onChange={(e) => setAudioEnabled(e.target.checked)}
          />
          <label htmlFor="audioEnabled" className="font-medium">
            Áudio ativado
          </label>
        </div>

        {/* Tipo de playlist */}
        <div>
          <label className="block font-medium">Tipo de playlist</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="media"
                checked={type === 'media'}
                onChange={() => setType('media')}
              />
              Mídia (arquivos)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="youtube"
                checked={type === 'youtube'}
                onChange={() => setType('youtube')}
              />
              YouTube
            </label>
          </div>
        </div>

        {/* YouTube */}
        {type === 'youtube' && (
          <div>
            <label className="block font-medium">URL do YouTube *</label>
            <input
              type="url"
              className="w-full border p-2 rounded"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Insira o link completo do vídeo do YouTube.
            </p>
          </div>
        )}

        {/* Seleção de Mídias */}
        {type === 'media' && (
          <div>
            <label className="block font-medium">Selecionar mídias</label>
            <input
              type="text"
              className="w-full border p-2 rounded mb-2"
              placeholder="Buscar mídia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="border rounded p-2 max-h-60 overflow-y-auto">
              {filteredMedia.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhuma mídia disponível. Faça upload primeiro.
                </p>
              ) : (
                filteredMedia.map((media) => (
                  <label
                    key={media.id}
                    className={`flex items-center gap-2 p-1 rounded hover:bg-gray-100 cursor-pointer ${
                      selectedMediaIds.includes(media.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMediaIds.includes(media.id)}
                      onChange={() => toggleMediaSelection(media.id)}
                    />
                    <span className="text-sm">
                      {media.media_type === 'video' ? '🎬' : '🖼️'} {media.file_name}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedMediaIds.length} mídia(s) selecionada(s)
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => navigate('/playlists')}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}