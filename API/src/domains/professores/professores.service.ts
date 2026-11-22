import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import {
  criarProfessor,
  desligarProfessorPorId,
  listarProfessoresPaginados,
} from "./professores.repository";
import { CriarProfessorBody, ListarProfessoresQuery } from "./professores.schema";

export interface ProfessorDTO {
  id: number;
  nome: string;
  titulacao: string;
  email: string;
  possuiCadastro: boolean;
  login: string | null;
}

/**
 * Lista professores cadastrados com paginação e busca opcional.
 */
export async function obterProfessores(
  query: ListarProfessoresQuery,
): Promise<PaginatedResponse<ProfessorDTO>> {
  const { items, total } = await listarProfessoresPaginados(query);
  const mapeados: ProfessorDTO[] = items.map((professor) => ({
    id: professor.id,
    nome: professor.nome,
    titulacao: professor.titulacao,
    email: professor.email,
    possuiCadastro: Boolean(professor.cadastro),
    login: professor.cadastro?.login ?? null,
  }));

  return buildPaginatedResponse(mapeados, total, query.page, query.pageSize);
}

/**
 * Cadastra um novo professor no sistema.
 */
export async function cadastrarProfessor(dados: CriarProfessorBody): Promise<ProfessorDTO> {
  const professor = await criarProfessor(dados);
  return {
    id: professor.id,
    nome: professor.nome,
    titulacao: professor.titulacao,
    email: professor.email,
    possuiCadastro: false,
    login: null,
  };
}

/**
 * Desliga um professor do sistema.
 */
export async function desligarProfessor(id: number): Promise<void> {
  await desligarProfessorPorId(id);
}
