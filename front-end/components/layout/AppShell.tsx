"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { BadgeTone, StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { PerfilTipo } from "@/types/auth.types";
import {
  formatarRotuloPerfil,
  obterIniciaisNome,
  obterRotaDashboardPorPerfil,
} from "@/utils/formatters.utils";

const TONE_POR_PERFIL: Record<PerfilTipo, BadgeTone> = {
  aluno: "sky",
  professor: "violet",
  servidor: "amber",
};

interface NavItem {
  label: string;
  href: string;
  ativo: boolean;
}

function obterNavegacaoPorPerfil(perfil: PerfilTipo, pathname: string): NavItem[] {
  if (perfil === "aluno") {
    return [
      {
        label: "Visão Geral",
        href: "/dashboard/aluno",
        ativo: pathname === "/dashboard/aluno",
      },
      {
        label: "Disciplinas Ofertadas",
        href: "/dashboard/aluno/ofertas",
        ativo: pathname.startsWith("/dashboard/aluno/ofertas"),
      },
      {
        label: "Disciplinas Matriculadas",
        href: "/dashboard/aluno/matriculas",
        ativo: pathname.startsWith("/dashboard/aluno/matriculas"),
      },
      {
        label: "Meus Horários",
        href: "/dashboard/aluno/horarios",
        ativo: pathname.startsWith("/dashboard/aluno/horarios"),
      },
      {
        label: "Progresso",
        href: "/dashboard/aluno/progresso",
        ativo: pathname.startsWith("/dashboard/aluno/progresso"),
      },
    ];
  }

  if (perfil === "servidor") {
    return [
      {
        label: "Visão Geral",
        href: "/dashboard/servidor",
        ativo: pathname === "/dashboard/servidor",
      },
    ];
  }

  return [
    {
      label: "Visão Geral",
      href: "/dashboard/professor",
      ativo: pathname === "/dashboard/professor",
    },
    {
      label: "Meus Horários",
      href: "/dashboard/professor/horarios",
      ativo: pathname.startsWith("/dashboard/professor/horarios"),
    },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { dadosMe, usuario, carregandoSessao, signOut } = useAuth();

  useEffect(() => {
    if (!carregandoSessao && !dadosMe) {
      router.replace("/login");
    }
  }, [carregandoSessao, dadosMe, router]);

  if (carregandoSessao || !dadosMe || !usuario) {
    return (
      <>
        <LoadingScreen message="Carregando ambiente acadêmico..." />
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </>
    );
  }

  const rotaDashboard = obterRotaDashboardPorPerfil(usuario.perfil);
  const navegacao = obterNavegacaoPorPerfil(usuario.perfil, pathname);

  const resumoSubtitulo =
    usuario.curso?.nome ??
    (usuario.titulacao ? `Titulação: ${usuario.titulacao}` : "Secretaria Acadêmica");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={rotaDashboard}
              className="flex items-center gap-2.5 text-slate-900 transition hover:opacity-85"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 8.5l10 5.5 10-5.5L12 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5v5c0 1.8 2.7 3.5 6 3.5s6-1.7 6-3.5v-5" />
                </svg>
              </span>
              <div>
                <span className="block text-sm font-bold leading-tight text-slate-900">
                  Sistema de Matrícula
                </span>
                <span className="block text-[11px] text-slate-500">Portal de Graduação</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                {obterIniciaisNome(usuario.nome)}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-900">{usuario.nome}</p>
                <p className="font-mono text-[11px] text-slate-500">@{usuario.login}</p>
              </div>
              <StatusBadge tone={TONE_POR_PERFIL[usuario.perfil]}>
                {formatarRotuloPerfil(usuario.perfil)}
              </StatusBadge>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.25 2.025a.75.75 0 010 1.114l-2.25 2.025a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Trocar usuário</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-6 lg:py-6">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="space-y-3 lg:sticky lg:top-20 lg:space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm">
                  {obterIniciaisNome(usuario.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{usuario.nome}</p>
                  <p className="truncate text-xs text-slate-500">{resumoSubtitulo}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 sm:pt-3">
                <StatusBadge tone={TONE_POR_PERFIL[usuario.perfil]}>
                  {formatarRotuloPerfil(usuario.perfil)}
                </StatusBadge>
                <span className="truncate font-mono text-[11px] text-slate-500">
                  @{usuario.login}
                </span>
              </div>
            </div>

            <nav
              aria-label="Navegação principal"
              className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm"
            >
              <p className="hidden px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
                Navegação
              </p>
              <ul className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                {navegacao.map((item) => (
                  <li key={item.href} className="lg:w-full">
                    <Link
                      href={item.href}
                      aria-current={item.ativo ? "page" : undefined}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm sm:font-medium lg:py-2.5 ${
                        item.ativo
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70 lg:ring-0"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.ativo && (
                        <span className="hidden h-1.5 w-1.5 rounded-full bg-indigo-600 lg:inline-block" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
