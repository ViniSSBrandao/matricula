"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeTone, StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { obterApiBaseUrl } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { authService, LOGINS_SEED_FALLBACK } from "@/services/auth.service";
import { LoginDisponivelSeed, PerfilTipo } from "@/types/auth.types";
import {
  formatarRotuloPerfil,
  obterIniciaisNome,
  obterRotaDashboardPorPerfil,
} from "@/utils/formatters.utils";

type FiltroPerfil = "todos" | PerfilTipo;

const FILTROS_PERFIL: Array<{ valor: FiltroPerfil; rotulo: string }> = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aluno", rotulo: "Alunos" },
  { valor: "professor", rotulo: "Docentes" },
  { valor: "servidor", rotulo: "Secretaria" },
];

const TONE_POR_PERFIL: Record<PerfilTipo, BadgeTone> = {
  aluno: "sky",
  professor: "violet",
  servidor: "amber",
};

export function LoginView() {
  const router = useRouter();
  const { signIn, carregandoAcao } = useAuth();

  const [loginInput, setLoginInput] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<FiltroPerfil>("todos");
  const [loginsDisponiveis, setLoginsDisponiveis] =
    useState<LoginDisponivelSeed[]>(LOGINS_SEED_FALLBACK);
  const [apiOnline, setApiOnline] = useState(true);
  const [recarregandoLogins, setRecarregandoLogins] = useState(false);

  const carregarLogins = useCallback(async () => {
    setRecarregandoLogins(true);
    try {
      const resultado = await authService.listarLoginsDisponiveis();
      setLoginsDisponiveis(resultado.logins);
      setApiOnline(resultado.origemApi);

      if (resultado.origemApi) {
        toastEngine.success("Conexão com a API restabelecida.");
      } else {
        toastEngine.warning("A API ainda está inacessível. Exibindo perfis locais do seed.");
      }
    } finally {
      setRecarregandoLogins(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function inicializarLogins() {
      const resultado = await authService.listarLoginsDisponiveis();
      if (!ativo) return;
      setLoginsDisponiveis(resultado.logins);
      setApiOnline(resultado.origemApi);
    }

    void inicializarLogins();

    return () => {
      ativo = false;
    };
  }, []);

  const loginsFiltrados = useMemo(() => {
    if (filtroPerfil === "todos") {
      return loginsDisponiveis;
    }
    return loginsDisponiveis.filter((item) => item.perfil === filtroPerfil);
  }, [filtroPerfil, loginsDisponiveis]);

  async function executarLogin(loginSelecionado: string) {
    const loginLimpo = loginSelecionado.trim();
    if (!loginLimpo) {
      toastEngine.warning("Informe um nome de usuário para entrar.");
      return;
    }

    try {
      const usuario = await signIn(loginLimpo);
      setApiOnline(true);
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    } catch {
      // O toast de erro já é disparado automaticamente pelo apiEngine.comToast
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await executarLogin(loginInput);
  }

  async function handleAtalhoClick(loginSelecionado: string) {
    setLoginInput(loginSelecionado);
    await executarLogin(loginSelecionado);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Acesso institucional
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Entrar no Portal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Digite seu login cadastrado (sem senha) ou escolha um perfil abaixo para entrar.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              apiOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span>{apiOnline ? "API conectada" : "API offline"}</span>
          </div>
        </div>

        {!apiOnline && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-900">
            <div>
              Não foi possível alcançar a API em{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-semibold">
                {obterApiBaseUrl()}
              </code>
              . Verifique se o servidor em <code className="font-mono">API/</code> está rodando.
            </div>
            <button
              type="button"
              disabled={recarregandoLogins}
              onClick={() => void carregarLogins()}
              className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {recarregandoLogins ? "Testando..." : "Tentar novamente"}
            </button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-3">
          <label htmlFor="login-input" className="block text-xs font-semibold text-slate-700">
            Nome de usuário (login)
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
              </span>
              <input
                id="login-input"
                type="text"
                autoComplete="username"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Ex.: ana.cc, bruno.cc, ricardo.prof ou secretaria"
                disabled={carregandoAcao}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={carregandoAcao}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregandoAcao ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <span>Foi adicionado pela Secretaria Acadêmica e ainda não tem login?</span>
          <Link
            href="/cadastro"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Criar conta (Aluno ou Professor) →
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Acesso rápido por perfil
            </h3>
            <p className="text-xs text-slate-500">
              Selecione um usuário do seed para acessar diretamente o dashboard correspondente.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
            {FILTROS_PERFIL.map((filtro) => {
              const ativo = filtroPerfil === filtro.valor;
              return (
                <button
                  key={filtro.valor}
                  type="button"
                  onClick={() => setFiltroPerfil(filtro.valor)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    ativo
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {filtro.rotulo}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {loginsFiltrados.map((item) => (
            <button
              key={item.login}
              type="button"
              disabled={carregandoAcao}
              onClick={() => void handleAtalhoClick(item.login)}
              className="group flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white transition group-hover:bg-indigo-600">
                {obterIniciaisNome(item.nome)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.nome}</p>
                  <StatusBadge tone={TONE_POR_PERFIL[item.perfil]}>
                    {formatarRotuloPerfil(item.perfil)}
                  </StatusBadge>
                </div>

                <p className="mt-0.5 truncate text-xs text-slate-600">{item.detalhe}</p>

                <div className="mt-2.5 flex items-center justify-between">
                  <code className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 group-hover:ring-indigo-300">
                    @{item.login}
                  </code>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100">
                    Entrar
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
