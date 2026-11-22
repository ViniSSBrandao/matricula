"use client";

import { FormEvent, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { ProfessorItem } from "@/types/secretaria.types";

interface EstadoCargaProfessores {
  chave: string;
  dados: RespostaPaginada<ProfessorItem> | null;
  erro: string | null;
}

export function ProfessoresView() {
  const { refreshDashboard } = useAuth();
  const { searchInput, setSearchInput, search, page, setPage, clearSearch } =
    useUrlListQuery();

  const chaveConsulta = `${page}|${search}`;
  const [reloadCount, setReloadCount] = useState(0);
  const [recarregandoManual, setRecarregandoManual] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCargaProfessores>({
    chave: "",
    dados: null,
    erro: null,
  });

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [titulacao, setTitulacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const [professorParaDesligar, setProfessorParaDesligar] =
    useState<ProfessorItem | null>(null);
  const [desligandoId, setDesligandoId] = useState<number | null>(null);
  const [erroDesligar, setErroDesligar] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    secretariaService
      .listarProfessores({ page, pageSize: 10, search })
      .then((resposta) => {
        if (!ativo) return;
        setEstadoCarga({ chave: chaveConsulta, dados: resposta, erro: null });
      })
      .catch((erro) => {
        if (!ativo) return;
        const mensagem =
          erro instanceof ApiClientError
            ? erro.message
            : "Não foi possível carregar os professores.";
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

  async function handleAdicionar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (salvando) return;

    setErroForm(null);
    setSalvando(true);

    try {
      const criado = await secretariaService.criarProfessor({
        nome: nome.trim(),
        email: email.trim(),
        ...(titulacao.trim() ? { titulacao: titulacao.trim() } : {}),
      });
      toastEngine.success(
        `${criado.nome} adicionado(a). Já pode criar conta usando ${criado.email}.`,
      );
      setNome("");
      setEmail("");
      setTitulacao("");

      const [atualizada] = await Promise.all([
        secretariaService.listarProfessores({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível adicionar o professor.";
      setErroForm(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesligamento() {
    if (!professorParaDesligar || desligandoId !== null) return;

    const alvo = professorParaDesligar;
    setDesligandoId(alvo.id);
    setErroDesligar(null);

    try {
      await secretariaService.desligarProfessor(alvo.id);
      setProfessorParaDesligar(null);
      toastEngine.success(`Professor(a) ${alvo.nome} desligado(a) do sistema.`);

      const [atualizada] = await Promise.all([
        secretariaService.listarProfessores({ page, pageSize: 10, search }),
        refreshDashboard(false),
      ]);
      setEstadoCarga({ chave: chaveConsulta, dados: atualizada, erro: null });
    } catch (erro) {
      const mensagem =
        erro instanceof ApiClientError
          ? erro.message
          : "Não foi possível desligar o professor.";
      setProfessorParaDesligar(null);
      setErroDesligar(mensagem);
      toastEngine.error(mensagem);
    } finally {
      setDesligandoId(null);
    }
  }

  const carregando = recarregandoManual || estadoCarga.chave !== chaveConsulta;
  const dados = estadoCarga.chave === chaveConsulta ? estadoCarga.dados : null;
  const erroCarga = estadoCarga.chave === chaveConsulta ? estadoCarga.erro : null;
  const itens = dados?.items ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        eyebrow="Corpo Docente"
        title="Adicionar Professor"
        subtitle="Docentes adicionados aqui ficam habilitados a criar sua conta na tela de cadastro usando o mesmo e-mail."
      >
        <form onSubmit={(e) => void handleAdicionar(e)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="prof-nome"
                className="block text-xs font-semibold text-slate-700"
              >
                Nome completo
              </label>
              <input
                id="prof-nome"
                type="text"
                required
                maxLength={255}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                placeholder="Ex.: Profa. Maria Silva"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="prof-email"
                className="block text-xs font-semibold text-slate-700"
              >
                E-mail institucional
              </label>
              <input
                id="prof-email"
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={salvando}
                placeholder="maria@ufpe.br"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="prof-titulacao"
                className="block text-xs font-semibold text-slate-700"
              >
                Titulação (opcional)
              </label>
              <input
                id="prof-titulacao"
                type="text"
                maxLength={30}
                value={titulacao}
                onChange={(e) => setTitulacao(e.target.value)}
                disabled={salvando}
                placeholder="Ex.: Doutora (padrão: Doutor)"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
              />
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Adicionando..." : "Adicionar professor"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Professores Cadastrados"
        badge={
          !carregando && dados ? (
            <StatusBadge tone="amber">{dados.total} docente(s)</StatusBadge>
          ) : undefined
        }
      >
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="prof-search" className="sr-only">
            Buscar professor por nome, e-mail ou titulação
          </label>
          <input
            id="prof-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, e-mail ou titulação..."
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

        {erroDesligar && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
          >
            {erroDesligar}
          </div>
        )}

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
              emptyTitle="Nenhum professor cadastrado"
              emptyDescription="Adicione docentes no formulário acima para liberar o acesso."
            />
          )
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Nome</th>
                    <th className="py-2.5 pr-4 font-semibold">Titulação</th>
                    <th className="py-2.5 pr-4 font-semibold">E-mail</th>
                    <th className="py-2.5 pr-4 font-semibold">Conta no Portal</th>
                    <th className="py-2.5 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {item.nome}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600">
                        {item.titulacao}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-700">
                        {item.email}
                      </td>
                      <td className="py-3 pr-4">
                        {item.possuiCadastro ? (
                          <StatusBadge tone="emerald">
                            Ativa (@{item.login})
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="slate">Aguardando cadastro</StatusBadge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          disabled={desligandoId !== null}
                          onClick={() => {
                            setErroDesligar(null);
                            setProfessorParaDesligar(item);
                          }}
                          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Desligar
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

      <ConfirmDialog
        open={professorParaDesligar !== null}
        title="Confirmar desligamento de professor"
        description={
          professorParaDesligar
            ? `Deseja desligar ${professorParaDesligar.nome} (${professorParaDesligar.email})? O cadastro vinculado também será removido.`
            : ""
        }
        confirmLabel="Sim, desligar"
        cancelLabel="Cancelar"
        loading={desligandoId !== null}
        onConfirm={() => void confirmarDesligamento()}
        onCancel={() => {
          if (desligandoId === null) {
            setProfessorParaDesligar(null);
          }
        }}
      />
    </div>
  );
}
