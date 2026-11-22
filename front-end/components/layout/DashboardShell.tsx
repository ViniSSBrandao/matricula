"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatarRotuloPerfil } from "@/utils/formatters.utils";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { usuario, dadosMe, carregandoAcao, refreshDashboard } = useAuth();

  if (!usuario || !dadosMe) {
    return <>{children}</>;
  }

  const contextoTopo =
    usuario.perfil === "aluno"
      ? `Curso: ${usuario.curso?.nome ?? "Não vinculado"}`
      : usuario.perfil === "professor"
        ? `Titulação: ${usuario.titulacao ?? "Docente"}`
        : "Gestão acadêmica e acompanhamento de turmas";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Dashboard • {formatarRotuloPerfil(usuario.perfil)}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Olá, {usuario.nome}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">{contextoTopo}</p>
        </div>

        <button
          type="button"
          disabled={carregandoAcao}
          onClick={() => void refreshDashboard(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            className={`h-4 w-4 ${carregandoAcao ? "animate-spin text-indigo-600" : "text-slate-500"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
              clipRule="evenodd"
            />
          </svg>
          <span>{carregandoAcao ? "Atualizando..." : "Atualizar dados"}</span>
        </button>
      </div>

      {children}
    </div>
  );
}
