"use client";

import { DashboardAlunoData, UsuarioAutenticado } from "../utils/auth.types";
import { calcularPercentualCh, formatarResumoHorarios } from "../utils/formatters.utils";

interface DashboardAlunoProps {
  usuario: UsuarioAutenticado;
  dados: DashboardAlunoData;
}

const BADGE_CLASSIFICACAO: Record<"obrigatoria" | "perfil" | "livre", string> = {
  obrigatoria: "bg-indigo-100 text-indigo-800",
  perfil: "bg-emerald-100 text-emerald-800",
  livre: "bg-slate-200 text-slate-800",
};

export default function DashboardAluno({ usuario, dados }: DashboardAlunoProps) {
  const { progresso, matriculasAtivas, historico } = dados;

  const pctObrigatoria = calcularPercentualCh(
    progresso.chObrigatoriaCumprida,
    progresso.chObrigatoriaExigida,
  );
  const pctPerfil = calcularPercentualCh(
    progresso.chPerfilAproveitada,
    progresso.chPerfilExigida,
  );
  const pctLivres = calcularPercentualCh(
    progresso.chLivresTotalCumprida,
    progresso.chLivresExigida,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Curso vinculado
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              {usuario.curso?.nome ?? "Curso não informado"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
              Exigência Perfil: {progresso.chPerfilExigida}h
            </span>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium">
              Exigência Livres: {progresso.chLivresExigida}h
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">Obrigatórias</span>
              <span className="font-mono text-xs font-semibold text-indigo-700">
                {progresso.chObrigatoriaCumprida}h / {progresso.chObrigatoriaExigida}h
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${pctObrigatoria}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{pctObrigatoria}% concluído</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">Perfil</span>
              <span className="font-mono text-xs font-semibold text-emerald-700">
                {progresso.chPerfilAproveitada}h / {progresso.chPerfilExigida}h
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${pctPerfil}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Total cursado: {progresso.chPerfilBruta}h
              {progresso.chExcedentePerfilParaLivre > 0 && (
                <span className="ml-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">
                  +{progresso.chExcedentePerfilParaLivre}h excedente → Livres
                </span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">Eletivas Livres</span>
              <span className="font-mono text-xs font-semibold text-amber-700">
                {progresso.chLivresTotalCumprida}h / {progresso.chLivresExigida}h
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${pctLivres}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {progresso.chLivresDireta}h diretas + {progresso.chExcedentePerfilParaLivre}h de
              excedente
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Matrículas Ativas (Cursando)
          </h3>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
            {matriculasAtivas.length} disciplina(s)
          </span>
        </div>

        {matriculasAtivas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nenhuma matrícula ativa com status cursando no momento.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {matriculasAtivas.map((item) => (
              <div
                key={item.idMatricula}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-indigo-700">
                      {item.codigoDisciplina}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">{item.nomeDisciplina}</h4>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${BADGE_CLASSIFICACAO[item.classificacaoNoCurso]}`}
                  >
                    {item.classificacaoNoCurso}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Docente: <span className="font-medium text-slate-800">{item.professor}</span> •{" "}
                  {item.cargaHoraria}h
                </p>
                <p className="mt-1.5 text-xs font-medium text-slate-700">
                  {formatarResumoHorarios(item.horarios)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Histórico Escolar</h3>
          <span className="text-xs font-medium text-slate-500">
            {historico.length} registro(s)
          </span>
        </div>

        {historico.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nenhuma disciplina concluída no histórico ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Código</th>
                  <th className="py-2.5 pr-4 font-semibold">Disciplina</th>
                  <th className="py-2.5 pr-4 font-semibold">CH</th>
                  <th className="py-2.5 pr-4 font-semibold">Tipo</th>
                  <th className="py-2.5 pr-4 font-semibold">Docente</th>
                  <th className="py-2.5 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historico.map((item) => (
                  <tr key={item.idMatricula} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-slate-700">
                      {item.codigoDisciplina}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {item.nomeDisciplina}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{item.cargaHoraria}h</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_CLASSIFICACAO[item.classificacaoNoCurso]}`}
                      >
                        {item.classificacaoNoCurso}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-600">{item.professor}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.statusMatricula === "aprovado"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.statusMatricula}
                      </span>
                    </td>
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
