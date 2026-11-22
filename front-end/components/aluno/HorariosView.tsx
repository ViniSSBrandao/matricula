"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClassificacaoBadge } from "@/components/ui/ClassificacaoBadge";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiClientError } from "@/engines/api.engine";
import { alunoService } from "@/services/aluno.service";
import {
  BlocoGrade,
  ClassificacaoDisciplina,
  RespostaGradeSemanal,
} from "@/types/aluno.types";
import {
  agruparBlocosPorDia,
  calcularFaixaEixo,
  calcularPosicaoBloco,
  DIAS_SEMANA_SEM_DOMINGO,
  filtrarBlocosSemDomingo,
  montarAriaLabelBloco,
  obterColunasDesktop,
  obterDiaInicialMobile,
} from "@/utils/grade.utils";
import {
  formatarMinutosParaHora,
  obterNomeDia,
  obterSiglaDia,
} from "@/utils/horario.utils";

const PIXELS_POR_HORA = 64;

interface EstiloBlocoClassificacao {
  cartao: string;
  codigo: string;
  titulo: string;
  horario: string;
  tag: string;
  rotuloCurto: string;
  simbolo: string;
}

const ESTILO_BLOCO: Record<ClassificacaoDisciplina, EstiloBlocoClassificacao> = {
  obrigatoria: {
    cartao:
      "border-indigo-300 bg-indigo-50 text-indigo-950 hover:border-indigo-500 hover:bg-indigo-100/90 focus-visible:ring-indigo-500",
    codigo: "text-indigo-800",
    titulo: "text-indigo-950",
    horario: "text-indigo-800",
    tag: "bg-indigo-200/80 text-indigo-900",
    rotuloCurto: "Obrigatória",
    simbolo: "●",
  },
  perfil: {
    cartao:
      "border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-100/90 focus-visible:ring-emerald-500",
    codigo: "text-emerald-800",
    titulo: "text-emerald-950",
    horario: "text-emerald-800",
    tag: "bg-emerald-200/80 text-emerald-900",
    rotuloCurto: "Eletiva de perfil",
    simbolo: "◆",
  },
  livre: {
    cartao:
      "border-amber-300 bg-amber-50 text-amber-950 hover:border-amber-500 hover:bg-amber-100/90 focus-visible:ring-amber-500",
    codigo: "text-amber-900",
    titulo: "text-amber-950",
    horario: "text-amber-900",
    tag: "bg-amber-200/80 text-amber-950",
    rotuloCurto: "Eletiva livre",
    simbolo: "○",
  },
};

export function HorariosView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [reloadCount, setReloadCount] = useState(0);
  const [grade, setGrade] = useState<RespostaGradeSemanal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [blocoSelecionado, setBlocoSelecionado] = useState<BlocoGrade | null>(null);

  useEffect(() => {
    let ativo = true;

    alunoService
      .buscarGradeSemanal()
      .then((resposta) => {
        if (!ativo) return;
        setGrade(resposta);
        setErroCarga(null);
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar sua grade de horários.";
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

  const blocosSemDomingo = useMemo(
    () => filtrarBlocosSemDomingo(grade?.blocos ?? []),
    [grade?.blocos],
  );
  const semHorario = grade?.semHorario ?? [];

  const colunasDesktop = useMemo(
    () => obterColunasDesktop(blocosSemDomingo),
    [blocosSemDomingo],
  );
  const faixaEixo = useMemo(
    () => calcularFaixaEixo(blocosSemDomingo),
    [blocosSemDomingo],
  );
  const blocosPorDia = useMemo(
    () => agruparBlocosPorDia(blocosSemDomingo),
    [blocosSemDomingo],
  );

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

  function tentarNovamente() {
    setCarregando(true);
    setErroCarga(null);
    setReloadCount((atual) => atual + 1);
  }

  const totalHorasEixo = Math.max(1, faixaEixo.horas.length - 1);
  const alturaGridPx = totalHorasEixo * PIXELS_POR_HORA;
  const semMatriculas =
    !carregando &&
    !erroCarga &&
    grade !== null &&
    blocosSemDomingo.length === 0 &&
    semHorario.length === 0;

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Planejamento Semanal"
        title="Meus Horários"
        subtitle="Acompanhe seus horários de aula de segunda a sábado e consulte detalhes de cada turma."
        badge={
          !carregando && !erroCarga ? (
            <StatusBadge tone="indigo">
              {blocosSemDomingo.length} bloco(s) na semana
            </StatusBadge>
          ) : undefined
        }
        action={
          <Link
            href="/dashboard/aluno/matriculas"
            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            Disciplinas matriculadas
          </Link>
        }
      >
        {carregando ? (
          <div aria-busy="true" aria-label="Carregando grade semanal" className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            <div className="h-80 w-full animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : erroCarga ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga}
            onRetry={tentarNovamente}
          />
        ) : semMatriculas ? (
          <ListStatePanel
            state="empty"
            emptyTitle="Nenhuma aula cadastrada na sua grade"
            emptyDescription="Realize matrícula nas disciplinas ofertadas para visualizar seu calendário semanal aqui."
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
                    {/* Coluna fixa de horários à esquerda */}
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

                    {/* Colunas dos dias */}
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
                            const estilo = ESTILO_BLOCO[bloco.classificacao];
                            const selecionado =
                              blocoSelecionado?.idMatricula === bloco.idMatricula &&
                              blocoSelecionado?.dia === bloco.dia &&
                              blocoSelecionado?.inicio === bloco.inicio;

                            return (
                              <button
                                key={`${bloco.idMatricula}-${bloco.dia}-${bloco.inicio}`}
                                type="button"
                                aria-label={montarAriaLabelBloco(bloco)}
                                aria-expanded={selecionado}
                                onClick={() => setBlocoSelecionado(bloco)}
                                style={{
                                  top: `${topPercent}%`,
                                  height: `${heightPercent}%`,
                                }}
                                className={`absolute inset-x-1 flex flex-col justify-between overflow-hidden rounded-xl border px-2 py-1.5 text-left shadow-xs transition focus:outline-none focus-visible:ring-2 ${
                                  estilo.cartao
                                } ${selecionado ? "ring-2 ring-indigo-600" : ""}`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span
                                      className={`font-mono text-[11px] font-bold ${estilo.codigo}`}
                                    >
                                      {bloco.disciplina.codigo}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold ${estilo.tag}`}
                                    >
                                      <span aria-hidden="true">{estilo.simbolo} </span>
                                      {bloco.classificacao === "obrigatoria"
                                        ? "Obrig."
                                        : bloco.classificacao === "perfil"
                                          ? "Perfil"
                                          : "Livre"}
                                    </span>
                                  </div>
                                  <p
                                    title={bloco.disciplina.nome}
                                    className={`mt-0.5 truncate text-xs font-semibold leading-tight ${estilo.titulo}`}
                                  >
                                    {bloco.disciplina.nome}
                                  </p>
                                </div>

                                <p
                                  className={`font-mono text-[10px] font-semibold ${estilo.horario}`}
                                >
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
                          ? "bg-indigo-600 text-white shadow-xs"
                          : qtd > 0
                            ? "border border-indigo-200/80 bg-white text-slate-900"
                            : "bg-transparent text-slate-500 hover:bg-white/70"
                      }`}
                    >
                      <span>{obterSiglaDia(dia)}</span>
                      {qtd > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            ativo
                              ? "bg-indigo-500 text-white"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {qtd}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel" aria-label={`Aulas de ${obterNomeDia(diaSelecionadoMobile)}`}>
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
                      const estilo = ESTILO_BLOCO[bloco.classificacao];
                      const selecionado =
                        blocoSelecionado?.idMatricula === bloco.idMatricula &&
                        blocoSelecionado?.dia === bloco.dia &&
                        blocoSelecionado?.inicio === bloco.inicio;

                      return (
                        <button
                          key={`mob-${bloco.idMatricula}-${bloco.dia}-${bloco.inicio}`}
                          type="button"
                          aria-label={montarAriaLabelBloco(bloco)}
                          aria-expanded={selecionado}
                          onClick={() => setBlocoSelecionado(bloco)}
                          className={`w-full rounded-2xl border p-3.5 text-left shadow-xs transition focus:outline-none focus-visible:ring-2 ${
                            estilo.cartao
                          } ${selecionado ? "ring-2 ring-indigo-600" : ""}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`font-mono text-xs font-bold ${estilo.codigo}`}>
                              {bloco.disciplina.codigo} •{" "}
                              {formatarMinutosParaHora(bloco.inicio)}–
                              {formatarMinutosParaHora(bloco.fim)}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${estilo.tag}`}
                            >
                              <span aria-hidden="true">{estilo.simbolo} </span>
                              {estilo.rotuloCurto}
                            </span>
                          </div>
                          <p
                            title={bloco.disciplina.nome}
                            className={`mt-1 text-sm font-semibold ${estilo.titulo}`}
                          >
                            {bloco.disciplina.nome}
                          </p>
                          <p className="mt-1 text-xs text-slate-700">
                            {bloco.professor.nome}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Legenda das classificações */}
            <div
              aria-label="Legenda de classificações"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700"
            >
              <span className="font-semibold text-slate-600">Legenda:</span>
              {(["obrigatoria", "perfil", "livre"] as ClassificacaoDisciplina[]).map(
                (tipo) => {
                  const estilo = ESTILO_BLOCO[tipo];
                  return (
                    <span
                      key={`leg-${tipo}`}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold ${estilo.cartao}`}
                    >
                      <span aria-hidden="true">{estilo.simbolo}</span>
                      <span>{estilo.rotuloCurto}</span>
                    </span>
                  );
                },
              )}
            </div>

            {/* Painel de detalhes do bloco selecionado */}
            {blocoSelecionado && (
              <div
                role="region"
                aria-label="Detalhes da disciplina selecionada"
                className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-xs sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {blocoSelecionado.disciplina.codigo}
                      </span>
                      <ClassificacaoBadge
                        classificacao={blocoSelecionado.classificacao}
                      />
                    </div>
                    <h4 className="mt-1 text-base font-bold text-slate-900">
                      {blocoSelecionado.disciplina.nome}
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
                    <dt className="font-semibold text-slate-500">Docente</dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-900">
                      {blocoSelecionado.professor.nome}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Horário</dt>
                    <dd className="mt-0.5 text-sm font-medium capitalize text-slate-900">
                      {obterNomeDia(blocoSelecionado.dia)},{" "}
                      {formatarMinutosParaHora(blocoSelecionado.inicio)}–
                      {formatarMinutosParaHora(blocoSelecionado.fim)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-indigo-200/70 pt-3">
                  <Link
                    href="/dashboard/aluno/matriculas"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Ir para Disciplinas Matriculadas
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
                  {semHorario.map((item) => (
                    <div
                      key={`sem-horario-${item.idMatricula}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {item.disciplina.codigo}
                          </span>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {item.disciplina.nome}
                          </p>
                        </div>
                        <ClassificacaoBadge classificacao={item.classificacao} />
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Docente:{" "}
                        <span className="font-medium text-slate-800">
                          {item.professor.nome}
                        </span>
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
