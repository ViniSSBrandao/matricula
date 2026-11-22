"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardProfessorData, UsuarioAutenticado } from "@/types/auth.types";
import { formatarResumoHorarios } from "@/utils/formatters.utils";

interface DashboardProfessorViewProps {
  usuario: UsuarioAutenticado;
  dados: DashboardProfessorData;
}

export function DashboardProfessorView({ usuario, dados }: DashboardProfessorViewProps) {
  const turmasAbertas = dados.turmas.filter((t) => t.status === "aberta");
  const turmasEncerradas = dados.turmas.filter((t) => t.status === "encerrada");

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Painel Docente"
        title="Resumo de Alocação"
        subtitle={`Titulação: ${usuario.titulacao ?? "-"} • E-mail: ${usuario.email}`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Turmas abertas"
            value={turmasAbertas.length}
            tone="indigo"
            detail="Ofertas ativas no semestre"
          />
          <MetricCard
            label="Turmas encerradas"
            value={turmasEncerradas.length}
            tone="slate"
            detail="Histórico letivo"
          />
          <MetricCard
            label="Total de turmas"
            value={dados.turmas.length}
            tone="emerald"
            detail="Vinculadas ao docente"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Turmas Abertas"
        badge={<StatusBadge tone="indigo">{turmasAbertas.length} turma(s)</StatusBadge>}
      >
        {turmasAbertas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nenhuma turma aberta vinculada a este docente.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {turmasAbertas.map((turma) => (
              <div
                key={turma.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-indigo-700">
                      {turma.codigoDisciplina}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">{turma.nomeDisciplina}</h4>
                  </div>
                  <StatusBadge tone="emerald">
                    {turma.ocupadas}/{turma.vagas} vagas
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-600">Carga horária: {turma.cargaHoraria}h</p>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  {formatarResumoHorarios(turma.horarios)}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Histórico de Turmas Encerradas"
        badge={<StatusBadge tone="slate">{turmasEncerradas.length} registro(s)</StatusBadge>}
      >
        {turmasEncerradas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma turma encerrada encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Turma</th>
                  <th className="py-2.5 pr-4 font-semibold">Código</th>
                  <th className="py-2.5 pr-4 font-semibold">Disciplina</th>
                  <th className="py-2.5 pr-4 font-semibold">CH</th>
                  <th className="py-2.5 font-semibold">Registros de Histórico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turmasEncerradas.map((turma) => (
                  <tr key={turma.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">#{turma.id}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-700">
                      {turma.codigoDisciplina}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {turma.nomeDisciplina}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{turma.cargaHoraria}h</td>
                    <td className="py-2.5 text-slate-600">{turma.totalHistorico} aluno(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
