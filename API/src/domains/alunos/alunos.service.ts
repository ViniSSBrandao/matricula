import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import {
  criarAluno,
  desligarAlunoPorId,
  listarAlunosPaginados,
} from "./alunos.repository";
import { CriarAlunoBody, ListarAlunosQuery } from "./alunos.schema";

export interface AlunoDTO {
  id: number;
  nome: string;
  curso: {
    id: number;
    nome: string;
  };
  possuiCadastro: boolean;
  login: string | null;
  email: string | null;
}

/**
 * Lista alunos cadastrados com paginação e busca opcional.
 */
export async function obterAlunos(
  query: ListarAlunosQuery,
): Promise<PaginatedResponse<AlunoDTO>> {
  const { items, total } = await listarAlunosPaginados(query);
  const mapeados: AlunoDTO[] = items.map((aluno) => ({
    id: aluno.id,
    nome: aluno.nome,
    curso: {
      id: aluno.curso.id,
      nome: aluno.curso.nome,
    },
    possuiCadastro: Boolean(aluno.cadastro),
    login: aluno.cadastro?.login ?? null,
    email: aluno.cadastro?.email ?? null,
  }));

  return buildPaginatedResponse(mapeados, total, query.page, query.pageSize);
}

/**
 * Pré-cadastra um novo aluno no sistema pela secretaria.
 */
export async function cadastrarAluno(dados: CriarAlunoBody): Promise<AlunoDTO> {
  const aluno = await criarAluno(dados);
  return {
    id: aluno.id,
    nome: aluno.nome,
    curso: {
      id: aluno.curso.id,
      nome: aluno.curso.nome,
    },
    possuiCadastro: false,
    login: null,
    email: null,
  };
}

/**
 * Desliga um aluno do sistema.
 */
export async function desligarAluno(id: number): Promise<void> {
  await desligarAlunoPorId(id);
}
