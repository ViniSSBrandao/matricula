"use client";

import { FormEvent, useState } from "react";
import { LoginDisponivelSeed } from "../utils/auth.types";
import { obterApiBaseUrl } from "../utils/api.utils";
import { formatarRotuloPerfil, obterClasseBadgePerfil } from "../utils/formatters.utils";

interface LoginCardProps {
  loginsDisponiveis: LoginDisponivelSeed[];
  apiOnline: boolean;
  carregando: boolean;
  erro: string | null;
  onLogin: (login: string) => Promise<void>;
  onRecarregarLogins: () => Promise<void>;
}

export default function LoginCard({
  loginsDisponiveis,
  apiOnline,
  carregando,
  erro,
  onLogin,
  onRecarregarLogins,
}: LoginCardProps) {
  const [loginInput, setLoginInput] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(loginInput);
  }

  async function handleAtalhoClick(loginSelecionado: string) {
    setLoginInput(loginSelecionado);
    await onLogin(loginSelecionado);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Autenticação sem senha
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Sistema de Matrícula de Graduação
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Entre informando apenas o nome de usuário cadastrado ou escolha um dos perfis do seed.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            <span
              className={`h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <span>{apiOnline ? "API conectada" : "API offline"}</span>
          </div>
        </div>

        {!apiOnline && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div>
              Não foi possível alcançar a API em{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
                {obterApiBaseUrl()}
              </code>
              . Certifique-se de rodar o servidor da pasta <code className="font-mono">API/</code>.
            </div>
            <button
              type="button"
              onClick={() => void onRecarregarLogins()}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="login-input" className="sr-only">
              Nome de usuário
            </label>
            <input
              id="login-input"
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Ex.: ana.cc, bruno.cc, ricardo.prof ou secretaria"
              disabled={carregando}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {erro && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {erro}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Acesso rápido — Logins do seed
            </h2>
            <p className="text-xs text-slate-500">
              Clique em qualquer perfil para autenticar e visualizar o respectivo dashboard.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {loginsDisponiveis.length} usuários
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loginsDisponiveis.map((item) => (
            <button
              key={item.login}
              type="button"
              disabled={carregando}
              onClick={() => void handleAtalhoClick(item.login)}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex w-full items-center justify-between gap-2">
                <code className="rounded bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-900 ring-1 ring-slate-200 group-hover:ring-indigo-300">
                  {item.login}
                </code>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${obterClasseBadgePerfil(item.perfil)}`}
                >
                  {formatarRotuloPerfil(item.perfil)}
                </span>
              </div>
              <p className="mt-2.5 text-sm font-semibold text-slate-900">{item.nome}</p>
              <p className="text-xs text-slate-600">{item.detalhe}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
