export function MediaCard({ item }: { item: any }) {
  return (
    <div className="bg-white rounded shadow p-2">
      <div className="aspect-video bg-gray-200 flex items-center justify-center">
        {item.file_type === 'video' ? '🎬' : '🖼️'}
      </div>
      <p className="font-medium truncate">{item.name || 'Sem nome'}</p>
      <p className="text-xs text-gray-500">{item.file_type}</p>
    </div>
  );
}