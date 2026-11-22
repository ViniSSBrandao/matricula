"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClassificacaoBadge } from "@/components/ui/ClassificacaoBadge";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { BadgeTone, StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { useUrlListQuery } from "@/hooks/useUrlListQuery";
import { alunoService } from "@/services/aluno.service";
import { OfertaItem } from "@/types/aluno.types";
import { formatarHorario } from "@/utils/horario.utils";
import {
  contarOfertasPorStatus,
  filtrarEOrdenarOfertas,
  FiltroClassificacaoOferta,
  FiltroStatusOferta,
  obterStatusOferta,
  OrdenacaoOferta,
  StatusOferta,
} from "@/utils/ofertas.utils";

const PAGE_SIZE = 10;

const OPCOES_STATUS: Array<{ valor: FiltroStatusOferta; rotulo: string }> = [
  { valor: "todos", rotulo: "Todas" },
  { valor: "cursando", rotulo: "Cursando" },
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "feita", rotulo: "Feitas" },
];

const BADGE_STATUS_OFERTA: Record<
  StatusOferta,
  { rotulo: string; tone: BadgeTone }
> = {
  cursando: { rotulo: "Cursando", tone: "sky" },
  pendente: { rotulo: "Pendente", tone: "amber" },
  feita: { rotulo: "Feita", tone: "emerald" },
};

function parseStatusParam(valor: string | null): FiltroStatusOferta {
  if (valor === "cursando" || valor === "pendente" || valor === "feita") {
    return valor;
  }
  return "todos";
}

function parseClassificacaoParam(valor: string | null): FiltroClassificacaoOferta {
  if (valor === "obrigatoria" || valor === "perfil" || valor === "livre") {
    return valor;
  }
  return "todas";
}

function parseOrdenacaoParam(valor: string | null): OrdenacaoOferta {
  if (
    valor === "nome-asc" ||
    valor === "nome-desc" ||
    valor === "codigo-asc" ||
    valor === "vagas-desc"
  ) {
    return valor;
  }
  return "status";
}

interface MotivoBloqueio {
  bloqueado: boolean;
  motivo?: string;
}

function obterMotivoBloqueio(oferta: OfertaItem): MotivoBloqueio {
  if (oferta.jaMatriculado) {
    return { bloqueado: true, motivo: "Já matriculado" };
  }
  if (oferta.jaAprovado) {
    return { bloqueado: true, motivo: "Já aprovado" };
  }
  if (oferta.vagasDisponiveis <= 0) {
    return { bloqueado: true, motivo: "Turma lotada" };
  }
  if (oferta.conflitaComHorario) {
    return { bloqueado: true, motivo: "Conflito de horário" };
  }
  return { bloqueado: false };
}

interface EstadoCargaOfertas {
  chave: string;
  itens: OfertaItem[];
  erro: string | null;
}

export function OfertasView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { refreshDashboard } = useAuth();
  const { searchInput, setSearchInput, search, page, setPage, clearSearch } =
    useUrlListQuery();

  const statusFiltro = parseStatusParam(searchParams.get("status"));
  const classificacaoFiltro = parseClassificacaoParam(
    searchParams.get("classificacao"),
  );
  const ordenacao = parseOrdenacaoParam(searchParams.get("sort"));

  const [reloadCount, setReloadCount] = useState(0);
  const [recarregandoManual, setRecarregandoManual] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaOfertas>({
    chave: "",
    itens: [],
    erro: null,
  });

  const [matriculandoId, setMatriculandoId] = useState<number | null>(null);
  const [errosPorTurma, setErrosPorTurma] = useState<Record<number, string>>({});

  useEffect(() => {
    let ativo = true;

    alunoService
      .listarTodasOfertas(search)
      .then((itens) => {
        if (!ativo) return;
        setEstadoCarga({
          chave: search,
          itens,
          erro: null,
        });
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar as disciplinas ofertadas.";
        setEstadoCarga({
          chave: search,
          itens: [],
          erro: mensagem,
        });
      })
      .finally(() => {
        if (ativo) {
          setRecarregandoManual(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [reloadCount, search]);

  const atualizarParametrosUrl = useCallback(
    (alteracoes: {
      status?: FiltroStatusOferta;
      classificacao?: FiltroClassificacaoOferta;
      sort?: OrdenacaoOferta;
      limparTudo?: boolean;
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (alteracoes.limparTudo) {
        params.delete("search");
        params.delete("status");
        params.delete("classificacao");
        params.delete("sort");
        params.delete("page");
        setSearchInput("");
      } else {
        if (alteracoes.status !== undefined) {
          if (alteracoes.status === "todos") {
            params.delete("status");
          } else {
            params.set("status", alteracoes.status);
          }
        }
        if (alteracoes.classificacao !== undefined) {
          if (alteracoes.classificacao === "todas") {
            params.delete("classificacao");
          } else {
            params.set("classificacao", alteracoes.classificacao);
          }
        }
        if (alteracoes.sort !== undefined) {
          if (alteracoes.sort === "status") {
            params.delete("sort");
          } else {
            params.set("sort", alteracoes.sort);
          }
        }
        params.delete("page");
      }

      const queryString = params.toString();
      const destino = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(destino, { scroll: false });
    },
    [pathname, router, searchParams, setSearchInput],
  );

  function tentarNovamente() {
    setRecarregandoManual(true);
    setReloadCount((atual) => atual + 1);
  }

  async function handleMatricular(oferta: OfertaItem) {
    if (matriculandoId !== null) return;

    setMatriculandoId(oferta.id);
    setErrosPorTurma((atual) => {
      if (!(oferta.id in atual)) return atual;
      const copia = { ...atual };
      delete copia[oferta.id];
      return copia;
    });

    try {
      await alunoService.realizarMatricula(oferta.id);
      toastEngine.success(
        `Matrícula realizada em ${oferta.disciplina.codigo} — ${oferta.disciplina.nome}.`,
      );
      const [ofertasAtualizadas] = await Promise.all([
        alunoService.listarTodasOfertas(search),
        refreshDashboard(false),
      ]);
      setEstadoCarga({
        chave: search,
        itens: ofertasAtualizadas,
        erro: null,
      });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível realizar a matrícula nesta turma.";
      setErrosPorTurma((atual) => ({ ...atual, [oferta.id]: mensagem }));
      toastEngine.error(mensagem);
    } finally {
      setMatriculandoId(null);
    }
  }

  const carregando = recarregandoManual || estadoCarga.chave !== search;
  const todosItens = useMemo(
    () => (estadoCarga.chave === search ? estadoCarga.itens : []),
    [estadoCarga.chave, estadoCarga.itens, search],
  );
  const erroCarga = estadoCarga.chave === search ? estadoCarga.erro : null;

  const itensPorClassificacao = useMemo(() => {
    if (classificacaoFiltro === "todas") {
      return todosItens;
    }
    return todosItens.filter((item) => item.classificacao === classificacaoFiltro);
  }, [classificacaoFiltro, todosItens]);

  const contagensStatus = useMemo(
    () => contarOfertasPorStatus(itensPorClassificacao),
    [itensPorClassificacao],
  );

  const itensFiltradosEOrdenados = useMemo(
    () =>
      filtrarEOrdenarOfertas(todosItens, {
        status: statusFiltro,
        classificacao: classificacaoFiltro,
        ordenacao,
      }),
    [classificacaoFiltro, ordenacao, statusFiltro, todosItens],
  );

  const totalItens = itensFiltradosEOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / PAGE_SIZE));
  const paginaAtual = Math.min(page, totalPaginas);
  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * PAGE_SIZE;
    return itensFiltradosEOrdenados.slice(inicio, inicio + PAGE_SIZE);
  }, [itensFiltradosEOrdenados, paginaAtual]);

  const temBusca = search.trim().length > 0;
  const temFiltroAtivo =
    temBusca ||
    statusFiltro !== "todos" ||
    classificacaoFiltro !== "todas" ||
    ordenacao !== "status";

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Matrícula Acadêmica"
        title="Disciplinas Ofertadas"
        subtitle="Consulte as turmas abertas, filtre por situação ou classificação e realize sua matrícula."
        badge={
          !carregando && !erroCarga ? (
            <StatusBadge tone="indigo">{totalItens} turma(s) exibida(s)</StatusBadge>
          ) : undefined
        }
      >
        <div className="mb-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="ofertas-search" className="sr-only">
              Buscar por código, nome da disciplina ou docente
            </label>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <input
                id="ofertas-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por código, disciplina ou professor..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
              />
            </div>

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

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-3.5">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por situação da disciplina">
              {OPCOES_STATUS.map((opcao) => {
                const ativo = statusFiltro === opcao.valor;
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => atualizarParametrosUrl({ status: opcao.valor })}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      ativo
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>{opcao.rotulo}</span>
                    {!carregando && !erroCarga && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          ativo
                            ? "bg-indigo-500/70 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {contagensStatus[opcao.valor]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:justify-between">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label
                    htmlFor="filtro-classificacao"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Classificação:
                  </label>
                  <select
                    id="filtro-classificacao"
                    value={classificacaoFiltro}
                    onChange={(e) =>
                      atualizarParametrosUrl({
                        classificacao: parseClassificacaoParam(e.target.value),
                      })
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="todas">Todas as classificações</option>
                    <option value="obrigatoria">Obrigatória</option>
                    <option value="perfil">Eletiva de perfil</option>
                    <option value="livre">Eletiva livre</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <label
                    htmlFor="ordenacao-ofertas"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Ordenar por:
                  </label>
                  <select
                    id="ordenacao-ofertas"
                    value={ordenacao}
                    onChange={(e) =>
                      atualizarParametrosUrl({
                        sort: parseOrdenacaoParam(e.target.value),
                      })
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="status">Cursando → Pendentes → Feitas</option>
                    <option value="nome-asc">Nome da disciplina (A–Z)</option>
                    <option value="nome-desc">Nome da disciplina (Z–A)</option>
                    <option value="codigo-asc">Código (A–Z)</option>
                    <option value="vagas-desc">Mais vagas disponíveis</option>
                  </select>
                </div>
              </div>

              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={() => atualizarParametrosUrl({ limparTudo: true })}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {carregando ? (
          <ListStatePanel state="loading" skeletonVariant="cards" skeletonCount={4} />
        ) : erroCarga ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga}
            onRetry={tentarNovamente}
          />
        ) : itensPaginados.length === 0 ? (
          temBusca || statusFiltro !== "todos" || classificacaoFiltro !== "todas" ? (
            <ListStatePanel
              state="no-results"
              searchTerm={search || undefined}
              onClearSearch={() => atualizarParametrosUrl({ limparTudo: true })}
            />
          ) : (
            <ListStatePanel
              state="empty"
              emptyTitle="Nenhuma disciplina ofertada no momento"
              emptyDescription="Não há turmas abertas disponíveis para matrícula neste período."
            />
          )
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {itensPaginados.map((oferta) => {
                const { bloqueado, motivo } = obterMotivoBloqueio(oferta);
                const statusOferta = obterStatusOferta(oferta);
                const statusBadge = BADGE_STATUS_OFERTA[statusOferta];
                const emEnvio = matriculandoId === oferta.id;
                const erroInline = errosPorTurma[oferta.id];
                const semVagas = oferta.vagasDisponiveis <= 0;

                return (
                  <article
                    key={oferta.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 sm:p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700">
                              {oferta.disciplina.codigo}
                            </span>
                            <span className="text-xs text-slate-500">
                              • {oferta.disciplina.cargaHoraria}h
                            </span>
                          </div>
                          <h4 className="mt-1 text-base font-semibold leading-snug text-slate-900">
                            {oferta.disciplina.nome}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge tone={statusBadge.tone}>
                            {statusBadge.rotulo}
                          </StatusBadge>
                          <ClassificacaoBadge classificacao={oferta.classificacao} />
                        </div>
                      </div>

                      <dl className="mt-3.5 space-y-2 text-xs text-slate-600">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <dt className="font-semibold text-slate-700">Docente:</dt>
                          <dd className="text-slate-800">
                            {oferta.professor.nome}
                            {oferta.professor.titulacao
                              ? ` (${oferta.professor.titulacao})`
                              : ""}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-semibold text-slate-700">Horários:</dt>
                          <dd className="mt-1 flex flex-wrap gap-1.5">
                            {oferta.horarios.length === 0 ? (
                              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                Sem horário definido
                              </span>
                            ) : (
                              oferta.horarios.map((h, index) => (
                                <span
                                  key={`${oferta.id}-h-${index}`}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-800"
                                >
                                  {formatarHorario(h)}
                                </span>
                              ))
                            )}
                          </dd>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <dt className="font-semibold text-slate-700">Vagas:</dt>
                          <dd>
                            <StatusBadge tone={semVagas ? "rose" : "emerald"}>
                              {semVagas
                                ? `Lotada (0 de ${oferta.vagas} disponíveis)`
                                : `${oferta.vagasDisponiveis} de ${oferta.vagas} disponíveis`}
                            </StatusBadge>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="mt-4 border-t border-slate-200/80 pt-3.5">
                      {erroInline && (
                        <div
                          role="alert"
                          className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
                        >
                          {erroInline}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {motivo ? (
                          <span className="text-xs font-semibold text-amber-800">
                            Indisponível: {motivo}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Turma apta para matrícula
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={bloqueado || matriculandoId !== null}
                          onClick={() => void handleMatricular(oferta)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
                        >
                          {emEnvio && (
                            <span
                              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                              aria-hidden="true"
                            />
                          )}
                          <span>
                            {emEnvio
                              ? "Matriculando..."
                              : motivo
                                ? motivo
                                : "Matricular"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationBar
              page={paginaAtual}
              totalPages={totalPaginas}
              total={totalItens}
              onPageChange={setPage}
              disabled={carregando}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
