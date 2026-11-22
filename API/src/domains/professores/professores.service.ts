import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import { criarProfessor, listarProfessoresPaginados } from "./professores.repository";
import { CriarProfessorBody, ListarProfessoresQuery } from "./professores.schema";

export interface ProfessorDTO {
  id: number;
  nome: string;
  titulacao: string;
  email: string;
}

/**
 * Lista professores cadastrados com paginação e busca opcional.
 */
export async function obterProfessores(
  query: ListarProfessoresQuery,
): Promise<PaginatedResponse<ProfessorDTO>> {
  const { items, total } = await listarProfessoresPaginados(query);
  return buildPaginatedResponse(items, total, query.page, query.pageSize);
}

/**
 * Cadastra um novo professor no sistema.
 */
export async function cadastrarProfessor(dados: CriarProfessorBody): Promise<ProfessorDTO> {
  return criarProfessor(dados);
}
