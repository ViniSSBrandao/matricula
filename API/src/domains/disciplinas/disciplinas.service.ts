import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import {
  atualizarDisciplina,
  criarDisciplina,
  listarDisciplinasPaginadas,
} from "./disciplinas.repository";
import { DisciplinaBody, ListarDisciplinasQuery } from "./disciplinas.schema";

export interface DisciplinaDTO {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

/**
 * Lista disciplinas com paginação e busca textual.
 */
export async function obterDisciplinas(
  query: ListarDisciplinasQuery,
): Promise<PaginatedResponse<DisciplinaDTO>> {
  const { items, total } = await listarDisciplinasPaginadas(query);
  return buildPaginatedResponse(items, total, query.page, query.pageSize);
}

/**
 * Cadastra uma nova disciplina.
 */
export async function cadastrarDisciplina(dados: DisciplinaBody): Promise<DisciplinaDTO> {
  return criarDisciplina(dados);
}

/**
 * Atualiza uma disciplina existente pelo seu ID.
 */
export async function editarDisciplina(
  id: number,
  dados: DisciplinaBody,
): Promise<DisciplinaDTO> {
  return atualizarDisciplina(id, dados);
}
