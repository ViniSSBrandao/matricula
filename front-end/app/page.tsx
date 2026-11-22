"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardAluno from "../components/DashboardAluno";
import DashboardProfessor from "../components/DashboardProfessor";
import DashboardServidor from "../components/DashboardServidor";
import LoginCard from "../components/LoginCard";
import {
  buscarDadosDashboard,
  buscarLoginsSeed,
  lerTokenSessao,
  limparTokenSessao,
  LOGINS_SEED_FALLBACK,
  realizarLoginSemSenha,
  salvarTokenSessao,
} from "../utils/api.utils";
import { LoginDisponivelSeed, RespostaMe } from "../utils/auth.types";
import { formatarRotuloPerfil, obterClasseBadgePerfil } from "../utils/formatters.utils";

export default function HomePage() {
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [autenticando, setAutenticando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dadosMe, setDadosMe] = useState<RespostaMe | null>(null);
  const [loginsDisponiveis, setLoginsDisponiveis] =
    useState<LoginDisponivelSeed[]>(LOGINS_SEED_FALLBACK);
  const [apiOnline, setApiOnline] = useState(true);

  const carregarLogins = useCallback(async () => {
    const resultado = await buscarLoginsSeed();
    setLoginsDisponiveis(resultado.logins);
    setApiOnline(resultado.origemApi);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function inicializarSessao() {
      const resultadoLogins = await buscarLoginsSeed();
      if (!ativo) return;

      setLoginsDisponiveis(resultadoLogins.logins);
      setApiOnline(resultadoLogins.origemApi);

      const tokenSalvo = lerTokenSessao();
      if (!tokenSalvo) {
        setCarregandoInicial(false);
        return;
      }

      try {
        const resposta = await buscarDadosDashboard(tokenSalvo);
        if (!ativo) return;
        setToken(tokenSalvo);
        setDadosMe(resposta);
      } catch {
        limparTokenSessao();
      } finally {
        if (ativo) {
          setCarregandoInicial(false);
        }
      }
    }

    void inicializarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  async function handleLogin(login: string) {
    setErro(null);
    setAutenticando(true);

    try {
      const { token: novoToken } = await realizarLoginSemSenha(login);
      const resposta = await buscarDadosDashboard(novoToken);
      salvarTokenSessao(novoToken);
      setToken(novoToken);
      setDadosMe(resposta);
      setApiOnline(true);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : "Falha ao autenticar usuário.";
      setErro(mensagem);
    } finally {
      setAutenticando(false);
    }
  }

  async function handleAtualizarDashboard() {
    if (!token) return;
    setErro(null);
    setAutenticando(true);
    try {
      const resposta = await buscarDadosDashboard(token);
      setDadosMe(resposta);
      setApiOnline(true);
    } catch (err) {
      const mensagem =
        err instanceof Error ? err.message : "Não foi possível atualizar o dashboard.";
      setErro(mensagem);
    } finally {
      setAutenticando(false);
    }
  }

  function handleLogout() {
    limparTokenSessao();
    setToken(null);
    setDadosMe(null);
    setErro(null);
  }

  if (carregandoInicial) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Carregando sessão...
        </div>
      </main>
    );
  }

  if (!dadosMe) {
    return (
      <main className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <LoginCard
          loginsDisponiveis={loginsDisponiveis}
          apiOnline={apiOnline}
          carregando={autenticando}
          erro={erro}
          onLogin={handleLogin}
          onRecarregarLogins={carregarLogins}
        />
      </main>
    );
  }

  const { usuario, dashboard } = dadosMe;

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base font-bold text-slate-900">Sistema de Matrícula</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${obterClasseBadgePerfil(usuario.perfil)}`}
            >
              {formatarRotuloPerfil(usuario.perfil)}
            </span>
            <span className="text-sm text-slate-600">
              {usuario.nome}{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                @{usuario.login}
              </code>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={autenticando}
              onClick={() => void handleAtualizarDashboard()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {autenticando ? "Atualizando..." : "Atualizar"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
            >
              Trocar usuário
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {erro}
          </div>
        )}

        {dashboard.tipo === "aluno" && (
          <DashboardAluno usuario={usuario} dados={dashboard} />
        )}
        {dashboard.tipo === "professor" && (
          <DashboardProfessor usuario={usuario} dados={dashboard} />
        )}
        {dashboard.tipo === "servidor" && (
          <DashboardServidor usuario={usuario} dados={dashboard} />
        )}
      </main>
    </div>
  );
}
