"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { authService } from "@/services/auth.service";
import { CursoCatalogo } from "@/types/auth.types";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

type PerfilCadastro = "aluno" | "professor";

export function RegisterView() {
  const router = useRouter();
  const { registerAccount, carregandoAcao } = useAuth();

  const [perfil, setPerfil] = useState<PerfilCadastro>("aluno");
  const [cursos, setCursos] = useState<CursoCatalogo[]>([]);
  const [carregandoCursos, setCarregandoCursos] = useState(true);

  const [nome, setNome] = useState("");
  const [idCurso, setIdCurso] = useState<string>("");
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [erroForm, setErroForm] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    authService
      .listarCursos()
      .then((res) => {
        if (!ativo) return;
        setCursos(res.items);
        if (res.items.length > 0) {
          setIdCurso(String(res.items[0].id));
        }
      })
      .catch(() => {
        if (!ativo) return;
        setCursos([]);
      })
      .finally(() => {
        if (ativo) {
          setCarregandoCursos(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroForm(null);

    const loginLimpo = login.trim();
    const emailLimpo = email.trim();

    if (!loginLimpo || !emailLimpo) {
      setErroForm("Preencha todos os campos obrigatórios.");
      return;
    }

    if (perfil === "aluno" && (!nome.trim() || !idCurso)) {
      setErroForm("Informe seu nome completo e selecione o curso.");
      return;
    }

    try {
      const usuario =
        perfil === "professor"
          ? await registerAccount({
              perfil: "professor",
              email: emailLimpo,
              login: loginLimpo,
            })
          : await registerAccount({
              perfil: "aluno",
              nome: nome.trim(),
              idCurso: Number(idCurso),
              email: emailLimpo,
              login: loginLimpo,
            });

      toastEngine.success("Conta criada e autenticada com sucesso.");
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível concluir o cadastro.";
      setErroForm(mensagem);
      toastEngine.error(mensagem);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Primeiro acesso
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Criar conta no Portal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              O cadastro é exclusivo para alunos e docentes previamente adicionados pela
              Secretaria Acadêmica.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Voltar ao login
          </Link>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl bg-slate-100 p-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={perfil === "aluno"}
            onClick={() => {
              setPerfil("aluno");
              setErroForm(null);
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              perfil === "aluno"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sou Aluno(a)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={perfil === "professor"}
            onClick={() => {
              setPerfil("professor");
              setErroForm(null);
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              perfil === "professor"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sou Professor(a)
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          {perfil === "aluno" ? (
            <>
              <div>
                <label
                  htmlFor="reg-nome"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Nome completo (conforme registrado pela secretaria)
                </label>
                <input
                  id="reg-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={carregandoAcao}
                  placeholder="Ex.: Ana Beatriz Souza"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-curso"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Curso
                </label>
                <select
                  id="reg-curso"
                  required
                  value={idCurso}
                  onChange={(e) => setIdCurso(e.target.value)}
                  disabled={carregandoAcao || carregandoCursos}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                >
                  {carregandoCursos ? (
                    <option value="">Carregando cursos...</option>
                  ) : cursos.length === 0 ? (
                    <option value="">Nenhum curso disponível</option>
                  ) : (
                    cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-900">
              Informe o mesmo <strong>e-mail institucional</strong> cadastrado pela
              Secretaria Acadêmica ao adicioná-lo como docente.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700"
              >
                {perfil === "professor"
                  ? "E-mail pré-cadastrado"
                  : "E-mail para a conta"}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregandoAcao}
                placeholder="nome@ufpe.br"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="reg-login"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome de usuário (login) desejado
              </label>
              <input
                id="reg-login"
                type="text"
                required
                minLength={3}
                maxLength={60}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={carregandoAcao}
                placeholder={perfil === "professor" ? "Ex.: maria.prof" : "Ex.: joao.cc"}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>
          </div>

          {erroForm && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
            >
              {erroForm}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              Já possui conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Entrar aqui
              </Link>
            </p>

            <button
              type="submit"
              disabled={carregandoAcao}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {carregandoAcao ? "Criando conta..." : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
