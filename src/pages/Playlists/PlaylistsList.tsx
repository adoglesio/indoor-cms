// src/pages/Playlists/PlaylistsList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Playlist } from '../../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

export function PlaylistsList() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  async function fetchPlaylists() {
    setLoading(true);
    // Busca playlists e a contagem de itens (apenas para tipo 'media')
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_items ( id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar playlists:', error);
      setPlaylists([]);
    } else {
      // Adiciona a contagem de itens manualmente
      const playlistsWithCount = (data || []).map((pl: any) => ({
        ...pl,
        items_count: pl.playlist_items ? pl.playlist_items.length : 0,
      }));
      setPlaylists(playlistsWithCount);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta playlist?')) return;
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
      await fetchPlaylists();
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'youtube') return '📺';
    return '📁';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Playlists</h1>
        <Link
          to="/playlists/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} /> Nova Playlist
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma playlist criada. Clique em "Nova Playlist" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((pl) => (
            <div key={pl.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{pl.name}</h3>
                  <p className="text-sm text-gray-600">
                    {pl.description || 'Sem descrição'}
                  </p>
                </div>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {getTypeIcon(pl.type)} {pl.type === 'youtube' ? 'YouTube' : 'Mídia'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${pl.orientation === 'vertical' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {pl.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
                </span>
                {pl.type === 'media' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {pl.items_count || 0} itens
                  </span>
                )}
                {pl.type === 'youtube' && pl.youtube_url && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded truncate max-w-[150px]">
                    🔗 YouTube
                  </span>
                )}
                <span className={`px-2 py-1 rounded ${pl.audio_enabled ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                  {pl.audio_enabled ? '🔊 Áudio' : '🔇 Sem áudio'}
                </span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-400">
                  {new Date(pl.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Link
                    to={`/playlists/${pl.id}/edit`}
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                  >
                    <Edit size={14} /> Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(pl.id)}
                    className="text-red-600 hover:underline flex items-center gap-1 text-sm"
                  >
                    <Trash2 size={14} /> Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}