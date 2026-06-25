
interface StatusBadgeProps {
  status: 'online' | 'offline' | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    online: 'bg-green-100 text-green-800',
    offline: 'bg-red-100 text-red-800',
  };

  const dotColors: Record<string, string> = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      <span className={`w-2 h-2 rounded-full ${dotColors[status] || 'bg-gray-500'}`}></span>
      {status}
    </span>
  );
}