"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { alunoService } from "@/services/aluno.service";
import { GrupoProgresso, RespostaProgresso } from "@/types/aluno.types";

interface ConfigGrupoCard {
  chave: keyof RespostaProgresso;
  titulo: string;
  descricao: string;
  barraClasse: string;
  destaqueTexto: string;
}

const GRUPOS_CONFIG: ConfigGrupoCard[] = [
  {
    chave: "obrigatorias",
    titulo: "Disciplinas Obrigatórias",
    descricao: "Componentes curriculares essenciais definidos na matriz do curso.",
    barraClasse: "bg-indigo-600",
    destaqueTexto: "text-indigo-700",
  },
  {
    chave: "perfil",
    titulo: "Eletivas de Perfil",
    descricao: "Disciplinas vinculadas ao curso para aprofundamento da formação.",
    barraClasse: "bg-emerald-600",
    destaqueTexto: "text-emerald-700",
  },
  {
    chave: "livres",
    titulo: "Eletivas Livres",
    descricao: "Disciplinas de livre escolha e eventuais excedentes de perfil.",
    barraClasse: "bg-amber-500",
    destaqueTexto: "text-amber-700",
  },
];

function GrupoProgressoCard({
  config,
  grupo,
}: {
  config: ConfigGrupoCard;
  grupo: GrupoProgresso;
}) {
  const percentualSeguro = Math.min(100, Math.max(0, grupo.percentual));
  const completo = grupo.falta === 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-base font-semibold text-slate-900">{config.titulo}</h4>
          <p className="mt-0.5 text-xs text-slate-600">{config.descricao}</p>
        </div>

        <StatusBadge tone={completo ? "emerald" : "slate"}>
          {completo ? "Concluído" : `Faltam ${grupo.falta}h`}
        </StatusBadge>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Integralização</span>
          <span className={`font-mono font-bold ${config.destaqueTexto}`}>
            {percentualSeguro}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label={`Progresso em ${config.titulo}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentualSeguro}
          aria-valuetext={`${percentualSeguro}% integralizado (${grupo.integralizada}h de ${grupo.exigida}h exigidas, ${grupo.emCurso}h em curso, faltam ${grupo.falta}h)`}
          className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className={`h-full rounded-full transition-all ${config.barraClasse}`}
            style={{ width: `${percentualSeguro}%` }}
          />
        </div>
        <p className="sr-only">
          {config.titulo}: {percentualSeguro}% concluído. Carga horária exigida:{" "}
          {grupo.exigida} horas; integralizada: {grupo.integralizada} horas; em curso:{" "}
          {grupo.emCurso} horas; faltante: {grupo.falta} horas.
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
          <dt className="text-[11px] font-medium text-slate-500">CH exigida</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-slate-900">
            {grupo.exigida}h
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
          <dt className="text-[11px] font-medium text-slate-500">Integralizada</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-emerald-700">
            {grupo.integralizada}h
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
          <dt className="text-[11px] font-medium text-slate-500">Em curso</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-sky-700">
            {grupo.emCurso}h
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
          <dt className="text-[11px] font-medium text-slate-500">Quanto falta</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold text-slate-900">
            {grupo.falta}h
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ProgressoView() {
  const { usuario } = useAuth();
  const [reloadCount, setReloadCount] = useState(0);
  const [progresso, setProgresso] = useState<RespostaProgresso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    alunoService
      .buscarProgresso()
      .then((resposta) => {
        if (!ativo) return;
        setProgresso(resposta);
        setErroCarga(null);
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar seu progresso curricular.";
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

  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow="Integralização Curricular"
        title="Meu Progresso"
        subtitle={
          usuario?.curso?.nome
            ? `Acompanhamento de carga horária no curso de ${usuario.curso.nome}.`
            : "Acompanhamento detalhado da carga horária exigida, integralizada e em curso."
        }
        action={
          <Link
            href="/dashboard/aluno/ofertas"
            className="inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            Disciplinas ofertadas
          </Link>
        }
      >
        {carregando ? (
          <ListStatePanel state="loading" skeletonVariant="rows" skeletonCount={3} />
        ) : erroCarga || !progresso ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga ?? "Dados de progresso indisponíveis."}
            onRetry={tentarNovamente}
          />
        ) : (
          <div className="space-y-4">
            {GRUPOS_CONFIG.map((config) => (
              <GrupoProgressoCard
                key={config.chave}
                config={config}
                grupo={progresso[config.chave]}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
