"use client";

import { DashboardProfessorData, UsuarioAutenticado } from "../utils/auth.types";
import { formatarResumoHorarios } from "../utils/formatters.utils";

interface DashboardProfessorProps {
  usuario: UsuarioAutenticado;
  dados: DashboardProfessorData;
}

export default function DashboardProfessor({ usuario, dados }: DashboardProfessorProps) {
  const turmasAbertas = dados.turmas.filter((t) => t.status === "aberta");
  const turmasEncerradas = dados.turmas.filter((t) => t.status === "encerrada");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Painel Docente
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{usuario.nome}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Titulação: <span className="font-medium text-slate-800">{usuario.titulacao ?? "-"}</span>{" "}
          • E-mail: <span className="font-medium text-slate-800">{usuario.email}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-indigo-700">{turmasAbertas.length}</span> turma(s)
            aberta(s)
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-slate-700">{turmasEncerradas.length}</span> turma(s)
            encerrada(s)
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Turmas Abertas</h3>
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
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {turma.ocupadas}/{turma.vagas} vagas
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">Carga horária: {turma.cargaHoraria}h</p>
                <p className="mt-1 text-xs font-medium text-slate-700">
                  {formatarResumoHorarios(turma.horarios)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Histórico de Turmas Encerradas
        </h3>
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
      </section>
    </div>
  );
}
