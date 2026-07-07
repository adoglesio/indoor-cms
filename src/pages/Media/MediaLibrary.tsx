// src/pages/Media/MediaLibrary.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, X, Play, Trash2 } from 'lucide-react';

interface MediaAsset {
  id: string;
  file_name: string;
  media_type: 'image' | 'video';
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
  owner_id: string;
}

export function MediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos');
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    // 🔥 Se não houver usuário, não tenta buscar
    if (!user?.id) {
      setMedia([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('owner_id', user.id) // 🔥 FILTRO POR USUÁRIO
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar mídias:', error);
      setMedia([]);
    } else {
      setMedia(data || []);
    }
    setLoading(false);
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Cada usuário sobe pra sua própria pasta dentro do bucket —
        // necessário pra política de Storage (RLS) conseguir isolar por dono.
        const filePath = `${user?.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        const mediaType = file.type.startsWith('video') ? 'video' : 'image';

        const { error: insertError } = await supabase
          .from('media_assets')
          .insert({
            file_name: file.name,
            media_type: mediaType,
            storage_path: urlData.publicUrl,
            mime_type: file.type,
            file_size_bytes: file.size,
            owner_id: user?.id || null, // 🔥 VINCULA AO USUÁRIO
          });

        if (insertError) throw insertError;
      }

      await fetchMedia();
      alert('Upload realizado com sucesso!');
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
      console.error(error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (item: MediaAsset) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${item.file_name}"?`)) return;

    // 🔥 Verifica se a mídia pertence ao usuário (segurança extra)
    if (item.owner_id !== user?.id) {
      alert('❌ Você não tem permissão para excluir esta mídia.');
      return;
    }

    setDeletingId(item.id);
    try {
      // Extrai o caminho completo dentro do bucket (ex: "abcd-uuid/123_foto.png"),
      // não só o nome do arquivo — senão a exclusão no Storage não encontra o arquivo.
      const marker = '/object/public/media/';
      const markerIndex = item.storage_path.indexOf(marker);
      const filePath = markerIndex >= 0
        ? item.storage_path.slice(markerIndex + marker.length)
        : item.storage_path.split('/').slice(-2).join('/');

      // 1. Deletar do Storage (se possível)
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (storageError) console.warn('Erro ao deletar do storage:', storageError);

      // 2. Deletar da tabela
      const { error: dbError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      await fetchMedia();
      alert('Arquivo excluído com sucesso!');
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMedia = media.filter((item) => {
    if (filter === 'todos') return true;
    if (filter === 'imagens') return item.media_type === 'image';
    if (filter === 'videos') return item.media_type === 'video';
    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Artes</h1>
        <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
          <Upload size={18} /> Upload
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['todos', 'imagens', 'videos'].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm ${
              filter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma mídia encontrada. Faça upload!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition group relative"
            >
              <div
                className="aspect-video bg-gray-100 relative cursor-pointer"
                onClick={() => {
                  if (item.media_type === 'video') {
                    setSelectedVideo(item.storage_path);
                  }
                }}
              >
                {item.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition">
                    <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100" />
                  </div>
                )}
                <img
                  src={item.storage_path}
                  alt={item.file_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="200" y="150" font-family="Arial" font-size="20" fill="%239ca3af" text-anchor="middle"%3EImagem indisponível%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="p-3 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" title={item.file_name}>
                    {item.file_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {item.media_type} • {formatFileSize(item.file_size_bytes)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition disabled:opacity-50"
                  title="Deletar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: '80vh' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}