// Componente para exibir um card de mídia na biblioteca
interface MediaItem {
  id: string;
  name: string;
  file_type: 'video' | 'image';
  s3_url?: string;
}

export function DeviceCard({ item }: { item: MediaItem }) {
  return (
    <div className="bg-white rounded shadow p-2">
      <div className="aspect-video bg-gray-200 flex items-center justify-center text-4xl">
        {item.file_type === 'video' ? '🎬' : '🖼️'}
      </div>
      <p className="font-medium truncate">{item.name || 'Sem nome'}</p>
      <p className="text-xs text-gray-500 capitalize">{item.file_type}</p>
    </div>
  );
}