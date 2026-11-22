"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { BadgeTone, StatusBadge } from "@/components/ui/StatusBadge";
import { DashboardAlunoData, UsuarioAutenticado } from "@/types/auth.types";
import { calcularPercentualCh, formatarResumoHorarios } from "@/utils/formatters.utils";

interface DashboardAlunoViewProps {
  usuario: UsuarioAutenticado;
  dados: DashboardAlunoData;
}

const TONE_CLASSIFICACAO: Record<"obrigatoria" | "perfil" | "livre", BadgeTone> = {
  obrigatoria: "indigo",
  perfil: "emerald",
  livre: "slate",
};

export function DashboardAlunoView({ usuario, dados }: DashboardAlunoViewProps) {
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
      <SectionCard
        eyebrow="Integralização Curricular"
        title={usuario.curso?.nome ?? "Curso não informado"}
        badge={
          <>
            <StatusBadge tone="slate">Perfil: {progresso.chPerfilExigida}h</StatusBadge>
            <StatusBadge tone="slate">Livres: {progresso.chLivresExigida}h</StatusBadge>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
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

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
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
      </SectionCard>

      <SectionCard
        title="Matrículas Ativas (Cursando)"
        badge={<StatusBadge tone="sky">{matriculasAtivas.length} disciplina(s)</StatusBadge>}
      >
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
                  <StatusBadge tone={TONE_CLASSIFICACAO[item.classificacaoNoCurso]}>
                    {item.classificacaoNoCurso}
                  </StatusBadge>
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
      </SectionCard>

      <SectionCard
        title="Histórico Escolar"
        badge={<StatusBadge tone="slate">{historico.length} registro(s)</StatusBadge>}
      >
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
                      <StatusBadge tone={TONE_CLASSIFICACAO[item.classificacaoNoCurso]}>
                        {item.classificacaoNoCurso}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-600">{item.professor}</td>
                    <td className="py-2.5">
                      <StatusBadge
                        tone={item.statusMatricula === "aprovado" ? "emerald" : "rose"}
                      >
                        {item.statusMatricula}
                      </StatusBadge>
                    </td>
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
