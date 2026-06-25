export function Pagination({ total, page, limit }: { total: number; page: number; limit: number }) {
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
      <span>Mostrando 1 - {Math.min(limit, total)} de {total} TVs</span>
      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" disabled={page === 1}>Anterior</button>
        <span className="px-3 py-1">Página {page} de {totalPages}</span>
        <button className="px-3 py-1 border rounded" disabled={page === totalPages}>Próxima</button>
      </div>
    </div>
  );
}