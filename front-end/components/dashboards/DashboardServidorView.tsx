"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardServidorData } from "@/types/auth.types";
import { formatarResumoHorarios } from "@/utils/formatters.utils";

interface DashboardServidorViewProps {
  dados: DashboardServidorData;
}

export function DashboardServidorView({ dados }: DashboardServidorViewProps) {
  const { metricas, cursos, turmasAbertas } = dados;

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Secretaria Acadêmica"
        title="Indicadores Gerais"
        subtitle="Visão consolidada do catálogo de cursos, corpo docente e turmas abertas do semestre."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Cursos" value={metricas.cursos} tone="indigo" />
          <MetricCard label="Disciplinas" value={metricas.disciplinas} tone="sky" />
          <MetricCard label="Alunos" value={metricas.alunos} tone="emerald" />
          <MetricCard
            label="Professores"
            value={metricas.professores}
            tone="amber"
            detail={`${metricas.professoresSemCadastro} sem login`}
          />
          <MetricCard label="Turmas Abertas" value={metricas.turmasAbertas} tone="emerald" />
          <MetricCard label="Turmas Encerradas" value={metricas.turmasEncerradas} tone="slate" />
        </div>
      </SectionCard>

      <SectionCard
        title="Cursos Cadastrados"
        badge={<StatusBadge tone="slate">{cursos.length} curso(s)</StatusBadge>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {cursos.map((curso) => (
            <div
              key={curso.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <h4 className="text-base font-semibold text-slate-900">{curso.nome}</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                <StatusBadge tone="slate">CH Perfil: {curso.chPerfil}h</StatusBadge>
                <StatusBadge tone="slate">CH Livres: {curso.chLivres}h</StatusBadge>
                <StatusBadge tone="sky">{curso.totalAlunos} aluno(s)</StatusBadge>
                <StatusBadge tone="indigo">
                  {curso.totalDisciplinasVinculadas} disciplina(s) na matriz
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Turmas Abertas"
        badge={<StatusBadge tone="emerald">{turmasAbertas.length} turma(s)</StatusBadge>}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Código</th>
                <th className="py-2.5 pr-4 font-semibold">Disciplina</th>
                <th className="py-2.5 pr-4 font-semibold">Docente</th>
                <th className="py-2.5 pr-4 font-semibold">Ocupação</th>
                <th className="py-2.5 font-semibold">Horários</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turmasAbertas.map((turma) => {
                const lotada = turma.ocupadas >= turma.vagas;
                return (
                  <tr key={turma.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-indigo-700">
                      {turma.codigoDisciplina}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {turma.nomeDisciplina}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({turma.cargaHoraria}h)
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-700">{turma.professor}</td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge tone={lotada ? "rose" : "emerald"}>
                        {turma.ocupadas}/{turma.vagas} {lotada ? "(Lotada)" : ""}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 text-xs text-slate-600">
                      {formatarResumoHorarios(turma.horarios)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
