"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClassificacaoBadge } from "@/components/ui/ClassificacaoBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { alunoService } from "@/services/aluno.service";
import { MatriculaItem } from "@/types/aluno.types";
import { formatarHorario } from "@/utils/horario.utils";

export function MatriculasView() {
  const { refreshDashboard } = useAuth();

  const [reloadCount, setReloadCount] = useState(0);
  const [itens, setItens] = useState<MatriculaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [matriculaParaCancelar, setMatriculaParaCancelar] =
    useState<MatriculaItem | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [errosPorMatricula, setErrosPorMatricula] = useState<Record<number, string>>({});

  useEffect(() => {
    let ativo = true;

    alunoService
      .listarMatriculas()
      .then((resposta) => {
        if (!ativo) return;
        setItens(resposta.items);
        setErroCarga(null);
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar suas matrículas ativas.";
        setErroCarga(mensagem);
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [reloadCount]);

  function tentarNovamente() {
    setCarregando(true);
    setErroCarga(null);
    setReloadCount((atual) => atual + 1);
  }

  async function confirmarCancelamento() {
    if (!matriculaParaCancelar || cancelandoId !== null) return;

    const alvo = matriculaParaCancelar;
    setCancelandoId(alvo.id);
    setErrosPorMatricula((atual) => {
      if (!(alvo.id in atual)) return atual;
      const copia = { ...atual };
      delete copia[alvo.id];
      return copia;
    });

    try {
      await alunoService.cancelarMatricula(alvo.id);
      setMatriculaParaCancelar(null);
      toastEngine.success(
        `Matrícula em ${alvo.disciplina.codigo} — ${alvo.disciplina.nome} cancelada.`,
      );
      const [matriculasAtualizadas] = await Promise.all([
        alunoService.listarMatriculas(),
        refreshDashboard(false),
      ]);
      setItens(matriculasAtualizadas.items);
      setErroCarga(null);
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível cancelar esta matrícula.";
      setMatriculaParaCancelar(null);
      setErrosPorMatricula((atual) => ({ ...atual, [alvo.id]: mensagem }));
      toastEngine.error(mensagem);
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Vínculos do Semestre"
        title="Disciplinas Matriculadas"
        subtitle="Acompanhe suas disciplinas em curso e cancele matrículas quando necessário."
        badge={
          !carregando && !erroCarga ? (
            <StatusBadge tone="sky">{itens.length} disciplina(s) ativa(s)</StatusBadge>
          ) : undefined
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/aluno/horarios"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Meus horários
            </Link>
            <Link
              href="/dashboard/aluno/ofertas"
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Ver disciplinas ofertadas
            </Link>
          </div>
        }
      >
        {carregando ? (
          <ListStatePanel state="loading" skeletonVariant="cards" skeletonCount={4} />
        ) : erroCarga ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga}
            onRetry={tentarNovamente}
          />
        ) : itens.length === 0 ? (
          <ListStatePanel
            state="empty"
            emptyTitle="Você ainda não possui disciplinas matriculadas"
            emptyDescription="Explore as disciplinas ofertadas do semestre para realizar sua primeira matrícula."
            emptyAction={
              <Link
                href="/dashboard/aluno/ofertas"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Explorar disciplinas ofertadas
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {itens.map((item) => {
              const erroInline = errosPorMatricula[item.id];
              const emCancelamento = cancelandoId === item.id;

              return (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                >
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {item.disciplina.codigo}
                          </span>
                          <span className="text-xs text-slate-500">
                            • {item.disciplina.cargaHoraria}h
                          </span>
                        </div>
                        <h4 className="mt-1 text-base font-semibold leading-snug text-slate-900">
                          {item.disciplina.nome}
                        </h4>
                      </div>

                      <ClassificacaoBadge classificacao={item.classificacao} />
                    </div>

                    <dl className="mt-3.5 space-y-2 text-xs text-slate-600">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <dt className="font-semibold text-slate-700">Docente:</dt>
                        <dd className="text-slate-800">
                          {item.professor.nome}
                          {item.professor.titulacao
                            ? ` (${item.professor.titulacao})`
                            : ""}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-slate-700">Horários:</dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {item.horarios.length === 0 ? (
                            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              Sem horário definido
                            </span>
                          ) : (
                            item.horarios.map((h, index) => (
                              <span
                                key={`${item.id}-h-${index}`}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-800"
                              >
                                {formatarHorario(h)}
                              </span>
                            ))
                          )}
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
                      <StatusBadge tone="sky">Cursando</StatusBadge>

                      <button
                        type="button"
                        disabled={cancelandoId !== null}
                        onClick={() => setMatriculaParaCancelar(item)}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {emCancelamento ? "Cancelando..." : "Cancelar matrícula"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={matriculaParaCancelar !== null}
        title="Confirmar cancelamento de matrícula"
        description={
          matriculaParaCancelar
            ? `Tem certeza que deseja cancelar sua matrícula em ${matriculaParaCancelar.disciplina.codigo} — ${matriculaParaCancelar.disciplina.nome}? A vaga será liberada imediatamente.`
            : ""
        }
        confirmLabel="Sim, cancelar matrícula"
        cancelLabel="Manter matrícula"
        loading={cancelandoId !== null}
        onConfirm={() => void confirmarCancelamento()}
        onCancel={() => {
          if (cancelandoId === null) {
            setMatriculaParaCancelar(null);
          }
        }}
      />
    </div>
  );
}
