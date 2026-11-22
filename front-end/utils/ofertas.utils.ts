import { ClassificacaoDisciplina, OfertaItem } from "@/types/aluno.types";

export type StatusOferta = "cursando" | "pendente" | "feita";
export type FiltroStatusOferta = "todos" | StatusOferta;
export type FiltroClassificacaoOferta = "todas" | ClassificacaoDisciplina;
export type OrdenacaoOferta =
  | "status"
  | "nome-asc"
  | "nome-desc"
  | "codigo-asc"
  | "vagas-desc";

const PRIORIDADE_STATUS: Record<StatusOferta, number> = {
  cursando: 0,
  pendente: 1,
  feita: 2,
};

export function obterStatusOferta(oferta: OfertaItem): StatusOferta {
  if (oferta.jaMatriculado) {
    return "cursando";
  }
  if (oferta.jaAprovado) {
    return "feita";
  }
  return "pendente";
}

export interface OpcoesFiltroEOrdenacaoOferta {
  status: FiltroStatusOferta;
  classificacao: FiltroClassificacaoOferta;
  ordenacao: OrdenacaoOferta;
}

export function filtrarEOrdenarOfertas(
  ofertas: OfertaItem[],
  opcoes: OpcoesFiltroEOrdenacaoOferta,
): OfertaItem[] {
  const filtradas = ofertas.filter((oferta) => {
    if (opcoes.status !== "todos" && obterStatusOferta(oferta) !== opcoes.status) {
      return false;
    }
    if (
      opcoes.classificacao !== "todas" &&
      oferta.classificacao !== opcoes.classificacao
    ) {
      return false;
    }
    return true;
  });

  return [...filtradas].sort((a, b) => {
    switch (opcoes.ordenacao) {
      case "nome-asc":
        return a.disciplina.nome.localeCompare(b.disciplina.nome, "pt-BR");
      case "nome-desc":
        return b.disciplina.nome.localeCompare(a.disciplina.nome, "pt-BR");
      case "codigo-asc":
        return a.disciplina.codigo.localeCompare(b.disciplina.codigo, "pt-BR");
      case "vagas-desc": {
        const diff = b.vagasDisponiveis - a.vagasDisponiveis;
        if (diff !== 0) return diff;
        return a.disciplina.nome.localeCompare(b.disciplina.nome, "pt-BR");
      }
      case "status":
      default: {
        const statusA = PRIORIDADE_STATUS[obterStatusOferta(a)];
        const statusB = PRIORIDADE_STATUS[obterStatusOferta(b)];
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        return a.disciplina.nome.localeCompare(b.disciplina.nome, "pt-BR");
      }
    }
  });
}

export function contarOfertasPorStatus(ofertas: OfertaItem[]): Record<FiltroStatusOferta, number> {
  const contagens: Record<FiltroStatusOferta, number> = {
    todos: ofertas.length,
    cursando: 0,
    pendente: 0,
    feita: 0,
  };

  for (const oferta of ofertas) {
    contagens[obterStatusOferta(oferta)] += 1;
  }

  return contagens;
}
