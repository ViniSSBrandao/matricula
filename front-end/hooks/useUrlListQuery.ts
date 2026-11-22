"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlListQueryOptions {
  debounceMs?: number;
}

function parsePage(raw: string | null): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

/**
 * Sincroniza busca (`?search=`) e página atual (`?page=`) na URL.
 * Aplica debounce ao digitar e reinicia a página para 1 quando o termo muda.
 */
export function useUrlListQuery(options: UseUrlListQueryOptions = {}) {
  const { debounceMs = 300 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(search);
  const ultimoSearchUrlRef = useRef(search);

  useEffect(() => {
    if (search !== ultimoSearchUrlRef.current) {
      ultimoSearchUrlRef.current = search;
      setSearchInput(search);
    }
  }, [search]);

  const navegarComParametros = useCallback(
    (proximoSearch: string, proximaPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      const termoLimpo = proximoSearch.trim();

      if (termoLimpo.length > 0) {
        params.set("search", termoLimpo);
      } else {
        params.delete("search");
      }

      if (proximaPage > 1) {
        params.set("page", String(proximaPage));
      } else {
        params.delete("page");
      }

      const queryString = params.toString();
      const destino = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(destino, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const termoAtualInput = searchInput.trim();
    const termoAtualUrl = search.trim();

    if (termoAtualInput === termoAtualUrl) {
      return;
    }

    const timer = setTimeout(() => {
      navegarComParametros(termoAtualInput, 1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [debounceMs, navegarComParametros, search, searchInput]);

  const setPage = useCallback(
    (novaPagina: number) => {
      const paginaSegura = Math.max(1, Math.floor(novaPagina));
      navegarComParametros(search, paginaSegura);
    },
    [navegarComParametros, search],
  );

  const clearSearch = useCallback(() => {
    setSearchInput("");
    navegarComParametros("", 1);
  }, [navegarComParametros]);

  return {
    searchInput,
    setSearchInput,
    search,
    page,
    setPage,
    clearSearch,
  };
}
