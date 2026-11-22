"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  BlocoGradeProfessor,
  montarAriaLabelBlocoProfessor,
  montarGradeProfessor,
} from "@/utils/grade-professor.utils";
import {
  agruparBlocosPorDia,
  calcularFaixaEixo,
  calcularPosicaoBloco,
  DIAS_SEMANA_SEM_DOMINGO,
  obterColunasDesktop,
  obterDiaInicialMobile,
} from "@/utils/grade.utils";
import {
  formatarMinutosParaHora,
  obterNomeDia,
  obterSiglaDia,
} from "@/utils/horario.utils";

const PIXELS_POR_HORA = 64;

export function HorariosProfessorView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { dadosMe, carregandoAcao, refreshDashboard } = useAuth();

  const [blocoSelecionado, setBlocoSelecionado] =
    useState<BlocoGradeProfessor | null>(null);

  useEffect(() => {
    if (!blocoSelecionado) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setBlocoSelecionado(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [blocoSelecionado]);

  const turmas = useMemo(() => {
    if (!dadosMe || dadosMe.dashboard.tipo !== "professor") {
      return [];
    }
    return dadosMe.dashboard.turmas;
  }, [dadosMe]);

  const { blocos, semHorario } = useMemo(
    () => montarGradeProfessor(turmas),
    [turmas],
  );

  const colunasDesktop = useMemo(() => obterColunasDesktop(blocos), [blocos]);
  const faixaEixo = useMemo(() => calcularFaixaEixo(blocos), [blocos]);
  const blocosPorDia = useMemo(() => agruparBlocosPorDia(blocos), [blocos]);

  const diaParam = searchParams.get("dia");
  const diaSelecionadoMobile = useMemo(
    () => obterDiaInicialMobile(blocosPorDia, diaParam),
    [blocosPorDia, diaParam],
  );

  function selecionarDiaMobile(dia: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dia", String(dia));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const totalHorasEixo = Math.max(1, faixaEixo.horas.length - 1);
  const alturaGridPx = totalHorasEixo * PIXELS_POR_HORA;
  const semAulasAtivas = blocos.length === 0 && semHorario.length === 0;

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Alocação Docente"
        title="Meus Horários"
        subtitle="Grade semanal de aulas das suas turmas abertas (segunda a sábado)."
        badge={
          <StatusBadge tone="violet">
            {blocos.length} aula(s) na semana
          </StatusBadge>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={carregandoAcao}
              onClick={() => void refreshDashboard(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregandoAcao ? "Atualizando..." : "Atualizar"}
            </button>
            <Link
              href="/dashboard/professor"
              className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Visão Geral
            </Link>
          </div>
        }
      >
        {semAulasAtivas ? (
          <ListStatePanel
            state="empty"
            emptyTitle="Nenhuma turma aberta com horário cadastrado"
            emptyDescription="Quando você estiver alocado em turmas abertas no semestre, seus horários aparecerão aqui."
            emptyAction={
              <Link
                href="/dashboard/professor"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Voltar à Visão Geral
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Visão Desktop e Tablet (>= 640px) */}
            <div className="hidden sm:block">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-[600px]">
                  <div
                    className="grid border-b border-slate-200 bg-slate-50"
                    style={{
                      gridTemplateColumns: `68px repeat(${colunasDesktop.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div className="border-r border-slate-200 px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Horário
                    </div>
                    {colunasDesktop.map((dia) => (
                      <div
                        key={`cab-${dia}`}
                        className="border-r border-slate-200 px-3 py-3 text-center last:border-r-0"
                      >
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                          {obterSiglaDia(dia)}
                        </span>
                        <span className="block text-[11px] capitalize text-slate-500">
                          {obterNomeDia(dia)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `68px repeat(${colunasDesktop.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div
                      className="relative border-r border-slate-200 bg-slate-50/60"
                      style={{ height: `${alturaGridPx}px` }}
                    >
                      {faixaEixo.horas.slice(0, -1).map((hora, idx) => (
                        <div
                          key={`eixo-${hora}`}
                          className="absolute inset-x-0 border-b border-slate-200/70 pr-2 text-right font-mono text-[11px] font-medium text-slate-500"
                          style={{
                            top: `${idx * PIXELS_POR_HORA}px`,
                            height: `${PIXELS_POR_HORA}px`,
                          }}
                        >
                          <span className="relative -top-2 inline-block bg-slate-50 px-1">
                            {formatarMinutosParaHora(hora * 60)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {colunasDesktop.map((dia) => {
                      const blocosDia = blocosPorDia[dia] ?? [];

                      return (
                        <div
                          key={`col-${dia}`}
                          className="relative border-r border-slate-200 last:border-r-0"
                          style={{ height: `${alturaGridPx}px` }}
                        >
                          {faixaEixo.horas.slice(0, -1).map((hora, idx) => (
                            <div
                              key={`linha-${dia}-${hora}`}
                              className="pointer-events-none absolute inset-x-0 border-b border-slate-100"
                              style={{
                                top: `${idx * PIXELS_POR_HORA}px`,
                                height: `${PIXELS_POR_HORA}px`,
                              }}
                            />
                          ))}

                          {blocosDia.map((bloco) => {
                            const { topPercent, heightPercent } = calcularPosicaoBloco(
                              bloco,
                              faixaEixo.inicioMin,
                              faixaEixo.fimMin,
                            );
                            const selecionado =
                              blocoSelecionado?.idTurma === bloco.idTurma &&
                              blocoSelecionado?.dia === bloco.dia &&
                              blocoSelecionado?.inicio === bloco.inicio;

                            return (
                              <button
                                key={`${bloco.idTurma}-${bloco.dia}-${bloco.inicio}`}
                                type="button"
                                aria-label={montarAriaLabelBlocoProfessor(bloco)}
                                aria-expanded={selecionado}
                                onClick={() => setBlocoSelecionado(bloco)}
                                style={{
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                }}
                                className={`absolute inset-x-1 flex flex-col justify-between overflow-hidden rounded-xl border border-violet-300 bg-violet-50 px-2 py-1.5 text-left text-violet-950 shadow-xs transition hover:border-violet-500 hover:bg-violet-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                                  selecionado ? "ring-2 ring-violet-600" : ""
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[11px] font-bold text-violet-800">
                                      {bloco.codigoDisciplina}
                                    </span>
                                    <span className="shrink-0 rounded bg-violet-200/80 px-1 py-0.5 font-mono text-[10px] font-semibold text-violet-900">
                                      {bloco.ocupadas}/{bloco.vagas}
                                    </span>
                                  </div>
                                  <p
                                    title={bloco.nomeDisciplina}
                                    className="mt-0.5 truncate text-xs font-semibold leading-tight text-violet-950"
                                  >
                                    {bloco.nomeDisciplina}
                                  </p>
                                </div>

                                <p className="font-mono text-[10px] font-semibold text-violet-800">
                                  {formatarMinutosParaHora(bloco.inicio)}–
                                  {formatarMinutosParaHora(bloco.fim)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Visão Mobile (< 640px) — abas por dia (Seg a Sáb) */}
            <div className="space-y-4 sm:hidden">
              <div
                role="tablist"
                aria-label="Dias da semana"
                className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5"
              >
                {DIAS_SEMANA_SEM_DOMINGO.map((dia) => {
                  const ativo = diaSelecionadoMobile === dia;
                  const qtd = (blocosPorDia[dia] ?? []).length;

                  return (
                    <button
                      key={`tab-dia-${dia}`}
                      type="button"
                      role="tab"
                      aria-selected={ativo}
                      onClick={() => selecionarDiaMobile(dia)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                        ativo
                          ? "bg-violet-600 text-white shadow-xs"
                          : qtd > 0
                            ? "border border-violet-200/80 bg-white text-slate-900"
                            : "bg-transparent text-slate-500 hover:bg-white/70"
                      }`}
                    >
                      <span>{obterSiglaDia(dia)}</span>
                      {qtd > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            ativo
                              ? "bg-violet-500 text-white"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {qtd}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                aria-label={`Aulas de ${obterNomeDia(diaSelecionadoMobile)}`}
              >
                {(blocosPorDia[diaSelecionadoMobile] ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-600">
                    Nenhuma aula agendada para{" "}
                    <span className="font-semibold capitalize">
                      {obterNomeDia(diaSelecionadoMobile)}
                    </span>
                    .
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(blocosPorDia[diaSelecionadoMobile] ?? []).map((bloco) => {
                      const selecionado =
                        blocoSelecionado?.idTurma === bloco.idTurma &&
                        blocoSelecionado?.dia === bloco.dia &&
                        blocoSelecionado?.inicio === bloco.inicio;

                      return (
                        <button
                          key={`mob-${bloco.idTurma}-${bloco.dia}-${bloco.inicio}`}
                          type="button"
                          aria-label={montarAriaLabelBlocoProfessor(bloco)}
                          aria-expanded={selecionado}
                          onClick={() => setBlocoSelecionado(bloco)}
                          className={`w-full rounded-2xl border border-violet-300 bg-violet-50 p-3.5 text-left text-violet-950 shadow-xs transition hover:border-violet-500 hover:bg-violet-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                            selecionado ? "ring-2 ring-violet-600" : ""
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-violet-800">
                              {bloco.codigoDisciplina} •{" "}
                              {formatarMinutosParaHora(bloco.inicio)}–
                              {formatarMinutosParaHora(bloco.fim)}
                            </span>
                            <span className="rounded-md bg-violet-200/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-900">
                              {bloco.ocupadas}/{bloco.vagas} alunos
                            </span>
                          </div>
                          <p
                            title={bloco.nomeDisciplina}
                            className="mt-1 text-sm font-semibold text-violet-950"
                          >
                            {bloco.nomeDisciplina}
                          </p>
                          <p className="mt-1 text-xs text-slate-700">
                            Turma #{bloco.idTurma} • {bloco.cargaHoraria}h
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Painel de detalhes da turma selecionada */}
            {blocoSelecionado && (
              <div
                role="region"
                aria-label="Detalhes da turma selecionada"
                className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-xs sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-violet-700">
                        {blocoSelecionado.codigoDisciplina}
                      </span>
                      <StatusBadge tone="slate">
                        Turma #{blocoSelecionado.idTurma}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          blocoSelecionado.ocupadas >= blocoSelecionado.vagas
                            ? "rose"
                            : "emerald"
                        }
                      >
                        {blocoSelecionado.ocupadas}/{blocoSelecionado.vagas} matriculados
                      </StatusBadge>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      {blocoSelecionado.nomeDisciplina}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBlocoSelecionado(null)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Fechar
                  </button>
                </div>

                <dl className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-500">Horário</dt>
                    <dd className="mt-0.5 text-sm font-medium capitalize text-slate-900">
                      {obterNomeDia(blocoSelecionado.dia)},{" "}
                      {formatarMinutosParaHora(blocoSelecionado.inicio)}–
                      {formatarMinutosParaHora(blocoSelecionado.fim)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Carga horária</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                      {blocoSelecionado.cargaHoraria}h
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-violet-200/70 pt-3">
                  <Link
                    href="/dashboard/professor"
                    className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-800"
                  >
                    Ver todas as turmas
                  </Link>
                </div>
              </div>
            )}

            {/* Turmas sem horário definido */}
            {semHorario.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Sem horário definido
                  </h4>
                  <StatusBadge tone="slate">
                    {semHorario.length} turma(s)
                  </StatusBadge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {semHorario.map((turma) => (
                    <div
                      key={`sem-horario-${turma.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-violet-700">
                            {turma.codigoDisciplina}
                          </span>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {turma.nomeDisciplina}
                          </p>
                        </div>
                        <StatusBadge tone="emerald">
                          {turma.ocupadas}/{turma.vagas} vagas
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Turma #{turma.id} • {turma.cargaHoraria}h
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
