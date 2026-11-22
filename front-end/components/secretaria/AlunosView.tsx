"use client";

import { FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { useUrlListQuery } from "@/hooks/useUrlListQuery";
import { authService } from "@/services/auth.service";
import { secretariaService } from "@/services/secretaria.service";
import { RespostaPaginada } from "@/types/aluno.types";
import { CursoCatalogo } from "@/types/auth.types";
import { AlunoItem } from "@/types/secretaria.types";

interface EstadoCargaAlunos {
  chave: string;
  dados: RespostaPaginada<AlunoItem> | null;
  erro: string | null;
}

export function AlunosView() {
  const { refreshDashboard } = useAuth();
  const { searchInput, setSearchInput, search, page, setPage, clearSearch } =
    useUrlListQuery();

  const chaveConsulta = `${page}|${search}`;
  const [reloadCount, setReloadCount] = useState(0);
  const [recarregandoManual, setRecarregandoManual] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaAlunos>({
    chave: "",
    dados: null,
    erro: null,
  });

  const [cursos, setCursos] = useState<CursoCatalogo[]>([]);
  const [nome, setNome] = useState("");
  const [idCurso, setIdCurso] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [alunoParaDesligar, setAlunoParaDesligar] = useState<AlunoItem | null>(null);
  const [desligandoId, setDesligandoId] = useState<number | null>(null);
  const [erroDesligar, setErroDesligar] = useState<string | null>(null);

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
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    secretariaService
      .listarAlunos({ page, pageSize: 10, search })
      .then((resposta) => {
        if (!ativo) return;
        setEstadoCarga({ chave: chaveConsulta, dados: resposta, erro: null });
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar os alunos.";
        setEstadoCarga({ chave: chaveConsulta, dados: null, erro: mensagem });
      })
      .finally(() => {
        if (ativo) {
          setRecarregandoManual(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [chaveConsulta, page, reloadCount, search]);

  function tentarNovamente() {
    setRecarregandoManual(true);
    setReloadCount((atual) => atual + 1);
  }

  async function handleAdicionar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando || !idCurso) return;

    setErroForm(null);
    setSalvando(true);

    try {
      const criado = await secretariaService.criarAluno({
        nome: nome.trim(),
        idCurso: Number(idCurso),
      });
      toastEngine.success(
        `Aluno(a) ${criado.nome} adicionado(a) em ${criado.curso.nome}.`,
      );
      setNome("");

      const [atualizada] = await Promise.all([
        secretariaService.listarAlunos({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível adicionar o aluno.";
      setErroForm(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesligamento() {
    if (!alunoParaDesligar || desligandoId !== null) return;

    const alvo = alunoParaDesligar;
    setDesligandoId(alvo.id);
    setErroDesligar(null);

    try {
      await secretariaService.desligarAluno(alvo.id);
      setAlunoParaDesligar(null);
      toastEngine.success(`Aluno(a) ${alvo.nome} desligado(a) do sistema.`);

      const [atualizada] = await Promise.all([
        secretariaService.listarAlunos({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível desligar o aluno.";
      setAlunoParaDesligar(null);
      setErroDesligar(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setDesligandoId(null);
    }
  }

  const carregando = recarregandoManual || estadoCarga.chave !== chaveConsulta;
  const dados = estadoCarga.chave === chaveConsulta ? estadoCarga.dados : null;
  const erroCarga = estadoCarga.chave === chaveConsulta ? estadoCarga.erro : null;
  const itens = dados?.items ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Discentes"
        title="Adicionar Aluno"
        subtitle="Alunos adicionados aqui ficam habilitados a criar sua conta na tela de cadastro informando o mesmo nome e curso."
      >
        <form onSubmit={(e) => void handleAdicionar(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="aluno-nome"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome completo
              </label>
              <input
                id="aluno-nome"
                type="text"
                required
                maxLength={255}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                placeholder="Ex.: João Pedro Silva"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="aluno-curso"
                className="block text-xs font-semibold text-slate-700"
              >
                Curso
              </label>
              <select
                id="aluno-curso"
                required
                value={idCurso}
                onChange={(e) => setIdCurso(e.target.value)}
                disabled={salvando || cursos.length === 0}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              >
                {cursos.length === 0 ? (
                  <option value="">Carregando cursos...</option>
                ) : (
                  cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {erroForm && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
            >
              {erroForm}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando || !idCurso}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Adicionando..." : "Adicionar aluno"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Alunos Cadastrados"
        badge={
          !carregando && dados ? (
            <StatusBadge tone="sky">{dados.total} aluno(s)</StatusBadge>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="aluno-search" className="sr-only">
            Buscar aluno por nome ou curso
          </label>
          <input
            id="aluno-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome do aluno ou curso..."
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          {searchInput.trim().length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar busca
            </button>
          )}
        </div>

        {erroDesligar && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
          >
            {erroDesligar}
          </div>
        )}

        {carregando ? (
          <ListStatePanel state="loading" skeletonVariant="rows" skeletonCount={5} />
        ) : erroCarga ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga}
            onRetry={tentarNovamente}
          />
        ) : itens.length === 0 ? (
          search.trim().length > 0 ? (
            <ListStatePanel
              state="no-results"
              searchTerm={search}
              onClearSearch={clearSearch}
            />
          ) : (
            <ListStatePanel
              state="empty"
              emptyTitle="Nenhum aluno cadastrado"
              emptyDescription="Adicione alunos no formulário acima para liberar o auto-cadastro."
            />
          )
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Nome</th>
                    <th className="py-2.5 pr-4 font-semibold">Curso</th>
                    <th className="py-2.5 pr-4 font-semibold">Conta no Portal</th>
                    <th className="py-2.5 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {item.nome}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600">
                        {item.curso.nome}
                      </td>
                      <td className="py-3 pr-4">
                        {item.possuiCadastro ? (
                          <StatusBadge tone="emerald">
                            Ativa (@{item.login})
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="slate">Aguardando cadastro</StatusBadge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          disabled={desligandoId !== null}
                          onClick={() => {
                            setErroDesligar(null);
                            setAlunoParaDesligar(item);
                          }}
                          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Desligar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dados && (
              <PaginationBar
                page={dados.page}
                totalPages={dados.totalPages}
                total={dados.total}
                onPageChange={setPage}
                disabled={carregando}
              />
            )}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={alunoParaDesligar !== null}
        title="Confirmar desligamento de aluno"
        description={
          alunoParaDesligar
            ? `Deseja desligar ${alunoParaDesligar.nome} (${alunoParaDesligar.curso.nome})? O cadastro vinculado também será removido.`
            : ""
        }
        confirmLabel="Sim, desligar"
        cancelLabel="Cancelar"
        loading={desligandoId !== null}
        onConfirm={() => void confirmarDesligamento()}
        onCancel={() => {
          if (desligandoId === null) {
            setAlunoParaDesligar(null);
          }
        }}
      />
    </div>
  );
}
