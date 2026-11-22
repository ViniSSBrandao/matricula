"use client";

import { DashboardServidorData, UsuarioAutenticado } from "../utils/auth.types";
import { formatarResumoHorarios } from "../utils/formatters.utils";

interface DashboardServidorProps {
  usuario: UsuarioAutenticado;
  dados: DashboardServidorData;
}

export default function DashboardServidor({ usuario, dados }: DashboardServidorProps) {
  const { metricas, cursos, turmasAbertas } = dados;

  const cardsMetricas = [
    { label: "Cursos", valor: metricas.cursos },
    { label: "Disciplinas", valor: metricas.disciplinas },
    { label: "Alunos", valor: metricas.alunos },
    {
      label: "Professores",
      valor: metricas.professores,
      detalhe: `${metricas.professoresSemCadastro} sem login`,
    },
    { label: "Turmas Abertas", valor: metricas.turmasAbertas },
    { label: "Turmas Encerradas", valor: metricas.turmasEncerradas },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Secretaria Acadêmica
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{usuario.nome}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Visão consolidada do catálogo de cursos, corpo docente e turmas abertas do semestre.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cardsMetricas.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"
            >
              <p className="text-2xl font-bold text-slate-900">{card.valor}</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{card.label}</p>
              {card.detalhe && <p className="mt-0.5 text-[11px] text-amber-700">{card.detalhe}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Cursos Cadastrados</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {cursos.map((curso) => (
            <div
              key={curso.id}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <h4 className="text-base font-semibold text-slate-900">{curso.nome}</h4>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  CH Perfil: {curso.chPerfil}h
                </span>
                <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  CH Livres: {curso.chLivres}h
                </span>
                <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  {curso.totalAlunos} aluno(s)
                </span>
                <span className="rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200">
                  {curso.totalDisciplinasVinculadas} disciplina(s) na matriz
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Turmas Abertas</h3>
          <span className="text-xs font-medium text-slate-500">
            {turmasAbertas.length} turma(s)
          </span>
        </div>

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
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lotada
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {turma.ocupadas}/{turma.vagas} {lotada ? "(Lotada)" : ""}
                      </span>
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
      </section>
    </div>
  );
}
