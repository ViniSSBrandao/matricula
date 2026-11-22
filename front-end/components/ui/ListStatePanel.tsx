import { ReactNode } from "react";

export type ListPanelState = "loading" | "error" | "empty" | "no-results";

interface ListStatePanelProps {
  state: ListPanelState;
  skeletonVariant?: "cards" | "rows";
  skeletonCount?: number;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  searchTerm?: string;
  onClearSearch?: () => void;
}

/**
 * Padroniza os 4 estados de listagem exigidos pela aplicação:
 * carregando, falha de comunicação, lista vazia e busca sem resultado.
 */
export function ListStatePanel({
  state,
  skeletonVariant = "cards",
  skeletonCount = 4,
  errorMessage = "Não foi possível carregar os dados.",
  onRetry,
  emptyTitle = "Nenhum item cadastrado",
  emptyDescription = "Ainda não há registros disponíveis para exibição.",
  emptyAction,
  searchTerm,
  onClearSearch,
}: ListStatePanelProps) {
  if (state === "loading") {
    if (skeletonVariant === "rows") {
      return (
        <div
          aria-busy="true"
          aria-label="Carregando conteúdo"
          className="space-y-3"
        >
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-3.5 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-48 rounded bg-slate-200" />
                </div>
                <div className="h-8 w-24 rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        aria-busy="true"
        aria-label="Carregando conteúdo"
        className="grid gap-4 md:grid-cols-2"
      >
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3.5 w-20 rounded bg-slate-200" />
                <div className="h-5 w-44 rounded bg-slate-200" />
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-slate-200" />
              <div className="h-3.5 w-1/2 rounded bg-slate-200" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-9 w-28 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center"
      >
        <p className="text-sm font-semibold text-rose-900">Falha ao carregar os dados</p>
        <p className="mt-1 text-sm text-rose-800">{errorMessage}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-800 shadow-xs transition hover:bg-rose-100"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (state === "no-results") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
        <p className="text-sm font-semibold text-slate-800">
          Nenhum resultado encontrado
          {searchTerm ? ` para "${searchTerm}"` : ""}.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Tente outro termo ou limpe a busca para visualizar todos os itens.
        </p>
        {onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
          >
            Limpar busca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
      <p className="text-sm font-semibold text-slate-800">{emptyTitle}</p>
      <p className="mt-1 text-xs text-slate-500">{emptyDescription}</p>
      {emptyAction && <div className="mt-4 flex justify-center">{emptyAction}</div>}
    </div>
  );
}
