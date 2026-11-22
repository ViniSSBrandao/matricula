"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ListStatePanel } from "@/components/ui/ListStatePanel";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/engines/api.engine";
import { toastEngine } from "@/engines/toast.engine";
import { useUrlListQuery } from "@/hooks/useUrlListQuery";
import { secretariaService } from "@/services/secretaria.service";
import { RespostaPaginada } from "@/types/aluno.types";
import { DisciplinaItem } from "@/types/secretaria.types";

const CARGAS_PERMITIDAS = [15, 30, 45, 60, 75, 90, 105, 120];

interface EstadoCargaDisciplinas {
  chave: string;
  dados: RespostaPaginada<DisciplinaItem> | null;
  erro: string | null;
}

export function DisciplinasView() {
  const { refreshDashboard } = useAuth();
  const { searchInput, setSearchInput, search, page, setPage, clearSearch } =
    useUrlListQuery();

  const chaveConsulta = `${page}|${search}`;
  const [reloadCount, setReloadCount] = useState(0);
  const [recarregandoManual, setRecarregandoManual] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaDisciplinas>({
    chave: "",
    dados: null,
    erro: null,
  });

  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState<number>(60);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    secretariaService
      .listarDisciplinas({ page, pageSize: 10, search })
      .then((resposta) => {
        if (!ativo) return;
        setEstadoCarga({ chave: chaveConsulta, dados: resposta, erro: null });
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar as disciplinas.";
        setEstadoCarga({ chave: chaveConsulta, dados: null, erro: mensagem });
      })
      .finally(() => {
        if (ativo) {
          setRecarregandoManual(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [chaveConsulta, page, reloadCount, search]);

  function tentarNovamente() {
    setRecarregandoManual(true);
    setReloadCount((atual) => atual + 1);
  }

  function iniciarEdicao(item: DisciplinaItem) {
    setEditandoId(item.id);
    setCodigo(item.codigo);
    setNome(item.nome);
    setCargaHoraria(item.cargaHoraria);
    setErroForm(null);
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setCodigo("");
    setNome("");
    setCargaHoraria(60);
    setErroForm(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;

    setErroForm(null);
    setSalvando(true);

    try {
      const payload = {
        codigo: codigo.trim().toUpperCase(),
        nome: nome.trim(),
        cargaHoraria: Number(cargaHoraria),
      };

      if (editandoId !== null) {
        await secretariaService.atualizarDisciplina(editandoId, payload);
        toastEngine.success(`Disciplina ${payload.codigo} atualizada com sucesso.`);
      } else {
        await secretariaService.criarDisciplina(payload);
        toastEngine.success(`Disciplina ${payload.codigo} criada com sucesso.`);
      }

      limparFormulario();
      const [atualizada] = await Promise.all([
        secretariaService.listarDisciplinas({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível salvar a disciplina.";
      setErroForm(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const carregando = recarregandoManual || estadoCarga.chave !== chaveConsulta;
  const dados = estadoCarga.chave === chaveConsulta ? estadoCarga.dados : null;
  const erroCarga = estadoCarga.chave === chaveConsulta ? estadoCarga.erro : null;
  const itens = dados?.items ?? [];

  return (
    <div className="space-y-6">
      <div ref={formSectionRef}>
        <SectionCard
          eyebrow="Catálogo Curricular"
          title={editandoId !== null ? "Editar Disciplina" : "Nova Disciplina"}
          subtitle="Cadastre ou atualize disciplinas com código único e carga horária múltipla de 15h."
        >
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label
                htmlFor="disc-codigo"
                className="block text-xs font-semibold text-slate-700"
              >
                Código
              </label>
              <input
                id="disc-codigo"
                type="text"
                required
                maxLength={10}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                disabled={salvando || editandoId !== null}
                placeholder="Ex.: IF999"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="disc-nome"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome da disciplina
              </label>
              <input
                id="disc-nome"
                type="text"
                required
                maxLength={255}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                placeholder="Ex.: Engenharia de Software"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="disc-ch"
                className="block text-xs font-semibold text-slate-700"
              >
                Carga horária
              </label>
              <select
                id="disc-ch"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(Number(e.target.value))}
                disabled={salvando}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              >
                {CARGAS_PERMITIDAS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}h
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erroForm && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
            >
              {erroForm}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {editandoId !== null && (
              <button
                type="button"
                disabled={salvando}
                onClick={limparFormulario}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar edição
              </button>
            )}
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : editandoId !== null
                  ? "Salvar alterações"
                  : "Criar disciplina"}
            </button>
          </div>
        </form>
        </SectionCard>
      </div>

      <SectionCard
        title="Disciplinas Cadastradas"
        badge={
          !carregando && dados ? (
            <StatusBadge tone="indigo">{dados.total} disciplina(s)</StatusBadge>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="disc-search" className="sr-only">
            Buscar disciplina por código ou nome
          </label>
          <input
            id="disc-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por código ou nome da disciplina..."
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          {searchInput.trim().length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Limpar busca
            </button>
          )}
        </div>

        {carregando ? (
          <ListStatePanel state="loading" skeletonVariant="rows" skeletonCount={5} />
        ) : erroCarga ? (
          <ListStatePanel
            state="error"
            errorMessage={erroCarga}
            onRetry={tentarNovamente}
          />
        ) : itens.length === 0 ? (
          search.trim().length > 0 ? (
            <ListStatePanel
              state="no-results"
              searchTerm={search}
              onClearSearch={clearSearch}
            />
          ) : (
            <ListStatePanel
              state="empty"
              emptyTitle="Nenhuma disciplina cadastrada"
              emptyDescription="Utilize o formulário acima para criar a primeira disciplina."
            />
          )
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Código</th>
                    <th className="py-2.5 pr-4 font-semibold">Nome</th>
                    <th className="py-2.5 pr-4 font-semibold">Carga Horária</th>
                    <th className="py-2.5 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono text-xs font-bold text-indigo-700">
                        {item.codigo}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {item.nome}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{item.cargaHoraria}h</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(item)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dados && (
              <PaginationBar
                page={dados.page}
                totalPages={dados.totalPages}
                total={dados.total}
                onPageChange={setPage}
                disabled={carregando}
              />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
