"use client";

import { FormEvent, useEffect, useState } from "react";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { useUrlListQuery } from "@/hooks/useUrlListQuery";
import { secretariaService } from "@/services/secretaria.service";
import { RespostaPaginada } from "@/types/aluno.types";
import {
  DisciplinaItem,
  ProfessorItem,
  TurmaSecretariaItem,
} from "@/types/secretaria.types";
import { formatarHorario, obterSiglaDia } from "@/utils/horario.utils";

interface HorarioRascunho {
  dia: number;
  inicioHora: string;
  fimHora: string;
}

function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

interface EstadoCargaTurmas {
  chave: string;
  dados: RespostaPaginada<TurmaSecretariaItem> | null;
  erro: string | null;
}

export function TurmasView() {
  const { refreshDashboard } = useAuth();
  const { searchInput, setSearchInput, search, page, setPage, clearSearch } =
    useUrlListQuery();

  const chaveConsulta = `${page}|${search}`;
  const [reloadCount, setReloadCount] = useState(0);
  const [recarregandoManual, setRecarregandoManual] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaTurmas>({
    chave: "",
    dados: null,
    erro: null,
  });

  const [disciplinas, setDisciplinas] = useState<DisciplinaItem[]>([]);
  const [professores, setProfessores] = useState<ProfessorItem[]>([]);

  const [idDisciplina, setIdDisciplina] = useState<string>("");
  const [idProfessor, setIdProfessor] = useState<string>("");
  const [vagas, setVagas] = useState<number>(30);
  const [horarios, setHorarios] = useState<HorarioRascunho[]>([
    { dia: 1, inicioHora: "08:00", fimHora: "10:00" },
  ]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [editandoVagasId, setEditandoVagasId] = useState<number | null>(null);
  const [novoTotalVagas, setNovoTotalVagas] = useState<string>("");
  const [salvandoVagas, setSalvandoVagas] = useState(false);
  const [erroVagasPorTurma, setErroVagasPorTurma] = useState<Record<number, string>>({});

  useEffect(() => {
    let ativo = true;

    Promise.all([
      secretariaService.listarDisciplinas({ page: 1, pageSize: 50 }),
      secretariaService.listarProfessores({ page: 1, pageSize: 50 }),
    ])
      .then(([resDisc, resProf]) => {
        if (!ativo) return;
        setDisciplinas(resDisc.items);
        setProfessores(resProf.items);
        if (resDisc.items.length > 0) setIdDisciplina(String(resDisc.items[0].id));
        if (resProf.items.length > 0) setIdProfessor(String(resProf.items[0].id));
      })
      .catch(() => {
        if (!ativo) return;
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    secretariaService
      .listarTurmas({ page, pageSize: 10, search })
      .then((resposta) => {
        if (!ativo) return;
        setEstadoCarga({ chave: chaveConsulta, dados: resposta, erro: null });
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar as turmas.";
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

  function adicionarHorario() {
    setHorarios((atual) => [
      ...atual,
      { dia: 3, inicioHora: "08:00", fimHora: "10:00" },
    ]);
  }

  function removerHorario(indice: number) {
    setHorarios((atual) => atual.filter((_, idx) => idx !== indice));
  }

  function atualizarHorario(
    indice: number,
    campo: keyof HorarioRascunho,
    valor: number | string,
  ) {
    setHorarios((atual) =>
      atual.map((item, idx) => (idx === indice ? { ...item, [campo]: valor } : item)),
    );
  }

  async function handleCriarTurma(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando || !idDisciplina || !idProfessor) return;

    setErroForm(null);

    const horariosConvertidos = horarios.map((h) => ({
      dia: Number(h.dia),
      inicio: horaParaMinutos(h.inicioHora),
      fim: horaParaMinutos(h.fimHora),
    }));

    for (const h of horariosConvertidos) {
      if (h.inicio < 0 || h.fim < 0 || h.fim <= h.inicio) {
        setErroForm("Todo horário deve ter hora de término posterior à de início.");
        return;
      }
    }

    setSalvando(true);

    try {
      const criada = await secretariaService.criarTurma({
        idDisciplina: Number(idDisciplina),
        idProfessor: Number(idProfessor),
        vagas: Number(vagas),
        horarios: horariosConvertidos,
      });

      toastEngine.success(
        `Turma #${criada.id} (${criada.disciplina.codigo}) criada com sucesso.`,
      );
      setVagas(30);
      setHorarios([{ dia: 1, inicioHora: "08:00", fimHora: "10:00" }]);

      const [atualizada] = await Promise.all([
        secretariaService.listarTurmas({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível criar a turma.";
      setErroForm(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function salvarNovasVagas(turmaId: number) {
    if (salvandoVagas) return;
    const vagasNum = Number.parseInt(novoTotalVagas, 10);
    if (!Number.isInteger(vagasNum) || vagasNum < 1) {
      setErroVagasPorTurma((atual) => ({
        ...atual,
        [turmaId]: "O número de vagas deve ser maior ou igual a 1.",
      }));
      return;
    }

    setSalvandoVagas(true);
    setErroVagasPorTurma((atual) => {
      const copia = { ...atual };
      delete copia[turmaId];
      return copia;
    });

    try {
      await secretariaService.atualizarVagasTurma(turmaId, vagasNum);
      setEditandoVagasId(null);
      toastEngine.success(`Vagas da turma #${turmaId} atualizadas para ${vagasNum}.`);

      const [atualizada] = await Promise.all([
        secretariaService.listarTurmas({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível atualizar as vagas da turma.";
      setErroVagasPorTurma((atual) => ({ ...atual, [turmaId]: mensagem }));
      toastEngine.error(mensagem);
    } finally {
      setSalvandoVagas(false);
    }
  }

  const carregando = recarregandoManual || estadoCarga.chave !== chaveConsulta;
  const dados = estadoCarga.chave === chaveConsulta ? estadoCarga.dados : null;
  const erroCarga = estadoCarga.chave === chaveConsulta ? estadoCarga.erro : null;
  const itens = dados?.items ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Oferta Letiva"
        title="Nova Turma"
        subtitle="Associe uma disciplina a um docente, defina vagas e adicione os horários semanais."
      >
        <form onSubmit={(e) => void handleCriarTurma(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="turma-disc"
                className="block text-xs font-semibold text-slate-700"
              >
                Disciplina
              </label>
              <select
                id="turma-disc"
                required
                value={idDisciplina}
                onChange={(e) => setIdDisciplina(e.target.value)}
                disabled={salvando || disciplinas.length === 0}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              >
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codigo} — {d.nome} ({d.cargaHoraria}h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="turma-prof"
                className="block text-xs font-semibold text-slate-700"
              >
                Docente
              </label>
              <select
                id="turma-prof"
                required
                value={idProfessor}
                onChange={(e) => setIdProfessor(e.target.value)}
                disabled={salvando || professores.length === 0}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              >
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="turma-vagas"
                className="block text-xs font-semibold text-slate-700"
              >
                Vagas
              </label>
              <input
                id="turma-vagas"
                type="number"
                min={1}
                required
                value={vagas}
                onChange={(e) => setVagas(Number(e.target.value))}
                disabled={salvando}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Horários da turma (opcional)
              </span>
              <button
                type="button"
                disabled={salvando}
                onClick={adicionarHorario}
                className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                + Adicionar horário
              </button>
            </div>

            {horarios.length === 0 ? (
              <p className="text-xs text-slate-500">
                Sem horários definidos (a turma será exibida na seção Sem horário definido).
              </p>
            ) : (
              <div className="space-y-2">
                {horarios.map((h, idx) => (
                  <div
                    key={`slot-${idx}`}
                    className="grid items-end gap-2 sm:grid-cols-4"
                  >
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        Dia
                      </label>
                      <select
                        value={h.dia}
                        onChange={(e) =>
                          atualizarHorario(idx, "dia", Number(e.target.value))
                        }
                        disabled={salvando}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      >
                        {[1, 2, 3, 4, 5, 6].map((dia) => (
                          <option key={dia} value={dia}>
                            {obterSiglaDia(dia)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        Início
                      </label>
                      <input
                        type="time"
                        required
                        value={h.inicioHora}
                        onChange={(e) =>
                          atualizarHorario(idx, "inicioHora", e.target.value)
                        }
                        disabled={salvando}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">
                        Término
                      </label>
                      <input
                        type="time"
                        required
                        value={h.fimHora}
                        onChange={(e) =>
                          atualizarHorario(idx, "fimHora", e.target.value)
                        }
                        disabled={salvando}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => removerHorario(idx)}
                        className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={salvando || !idDisciplina || !idProfessor}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Criando..." : "Criar turma"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Turmas Cadastradas"
        badge={
          !carregando && dados ? (
            <StatusBadge tone="emerald">{dados.total} turma(s)</StatusBadge>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="turmas-search" className="sr-only">
            Buscar turma por disciplina ou docente
          </label>
          <input
            id="turmas-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por código/nome da disciplina ou professor..."
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
              emptyTitle="Nenhuma turma cadastrada"
              emptyDescription="Crie a primeira turma utilizando o formulário acima."
            />
          )
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Turma</th>
                    <th className="py-2.5 pr-4 font-semibold">Disciplina</th>
                    <th className="py-2.5 pr-4 font-semibold">Docente</th>
                    <th className="py-2.5 pr-4 font-semibold">Horários</th>
                    <th className="py-2.5 pr-4 font-semibold">Ocupação</th>
                    <th className="py-2.5 text-right font-semibold">Ajustar vagas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((turma) => {
                    const emEdicao = editandoVagasId === turma.id;
                    const erroVagas = erroVagasPorTurma[turma.id];

                    return (
                      <tr key={turma.id} className="align-top hover:bg-slate-50">
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs font-semibold text-slate-600">
                            #{turma.id}
                          </span>
                          <div className="mt-1">
                            <StatusBadge
                              tone={turma.status === "aberta" ? "emerald" : "slate"}
                            >
                              {turma.status}
                            </StatusBadge>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {turma.disciplina.codigo}
                          </span>
                          <p className="font-medium text-slate-900">
                            {turma.disciplina.nome}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-700">
                          {turma.professor.nome}
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-600">
                          {turma.horarios.length === 0
                            ? "Sem horário definido"
                            : turma.horarios.map(formatarHorario).join(" • ")}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            tone={turma.vagasDisponiveis <= 0 ? "rose" : "emerald"}
                          >
                            {turma.ocupadas}/{turma.vagas}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-right">
                          {emEdicao ? (
                            <div className="inline-flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  value={novoTotalVagas}
                                  onChange={(e) => setNovoTotalVagas(e.target.value)}
                                  disabled={salvandoVagas}
                                  aria-label={`Nova quantidade de vagas para turma ${turma.id}`}
                                  className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900"
                                />
                                <button
                                  type="button"
                                  disabled={salvandoVagas}
                                  onClick={() => void salvarNovasVagas(turma.id)}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  disabled={salvandoVagas}
                                  onClick={() => setEditandoVagasId(null)}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                  Cancelar
                                </button>
                              </div>
                              {erroVagas && (
                                <p role="alert" className="text-[11px] font-medium text-rose-700">
                                  {erroVagas}
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoVagasId(turma.id);
                                setNovoTotalVagas(String(turma.vagas));
                              }}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Alterar vagas
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
    </div>
  );
}
