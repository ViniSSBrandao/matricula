"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

const DESTAQUES_SISTEMA = [
  {
    titulo: "Controle transacional de vagas",
    descricao: "Bloqueio por linha no banco de dados evitando superlotação em matrículas simultâneas.",
  },
  {
    titulo: "Detecção de choque de horários",
    descricao: "Sinalização preventiva de conflitos entre turmas antes mesmo da confirmação.",
  },
  {
    titulo: "Progresso curricular automatizado",
    descricao: "Cálculo separado de obrigatórias, perfil e eletivas livres com transbordo automático.",
  },
];

export function AuthLayoutShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { usuario, carregandoSessao } = useAuth();

  useEffect(() => {
    if (!carregandoSessao && usuario) {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    }
  }, [carregandoSessao, usuario, router]);

  return (
    <div className="relative grid min-h-screen flex-1 bg-slate-50 lg:grid-cols-12">
      {!carregandoSessao && usuario && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-50/90 backdrop-blur-xs">
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-slate-700">Redirecionando...</span>
          </div>
        </div>
      )}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-10 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-70" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-inner">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 8.5l10 5.5 10-5.5L12 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5v5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                Portal Acadêmico
              </p>
              <p className="text-sm font-bold text-white">Graduação UFPE</p>
            </div>
          </div>

          <h1 className="mt-10 text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Matrícula universitária clara, segura e sem fricção.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Acesse com seu usuário institucional para acompanhar integralização curricular, consultar
            ofertas e gerenciar turmas de acordo com o seu perfil acadêmico.
          </p>

          <div className="mt-10 space-y-3.5">
            {DESTAQUES_SISTEMA.map((item) => (
              <div
                key={item.titulo}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">{item.titulo}</h2>
                </div>
                <p className="mt-1 pl-4.5 text-xs leading-relaxed text-slate-300">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>Ambiente de Demonstração</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[11px] text-indigo-200">
            Autenticação sem senha
          </span>
        </div>
      </aside>

      <div className="flex flex-col lg:col-span-7">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 8.5l10 5.5 10-5.5L12 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5v5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-5" />
                </svg>
              </div>
              <span className="text-sm font-bold">Sistema de Matrícula</span>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200">
              Graduação
            </span>
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
