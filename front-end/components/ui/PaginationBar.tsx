interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
  disabled = false,
}: PaginationBarProps) {
  if (total === 0 && totalPages <= 1) {
    return null;
  }

  const totalPaginasSeguro = Math.max(1, totalPages);
  const temAnterior = page > 1;
  const temProxima = page < totalPaginasSeguro;

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs"
    >
      <p className="text-xs text-slate-600">
        Página <span className="font-semibold text-slate-900">{page}</span> de{" "}
        <span className="font-semibold text-slate-900">{totalPaginasSeguro}</span> •{" "}
        <span className="font-medium text-slate-800">{total}</span> registro(s)
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || !temAnterior}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={disabled || !temProxima}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}
