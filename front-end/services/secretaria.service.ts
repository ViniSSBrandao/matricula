import { apiEngine } from "@/engines/api.engine";
import { RespostaPaginada } from "@/types/aluno.types";
import {
  AlunoItem,
  CriarAlunoPayload,
  CriarProfessorPayload,
  CriarTurmaPayload,
  DisciplinaItem,
  DisciplinaPayload,
  ProfessorItem,
  TurmaSecretariaItem,
} from "@/types/secretaria.types";

export interface PaginacaoBuscaParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

function montarQueryPaginada(params: PaginacaoBuscaParams): Record<string, unknown> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  };
  if (params.search && params.search.trim().length > 0) {
    query.search = params.search.trim();
  }
  return query;
}

export async function listarDisciplinas(
  params: PaginacaoBuscaParams = {},
): Promise<RespostaPaginada<DisciplinaItem>> {
  return apiEngine.semToast.get<RespostaPaginada<DisciplinaItem>>("/disciplinas", {
    params: montarQueryPaginada(params),
  });
}

export async function criarDisciplina(payload: DisciplinaPayload): Promise<DisciplinaItem> {
  return apiEngine.semToast.post<DisciplinaItem>("/disciplinas", payload);
}

export async function atualizarDisciplina(
  id: number,
  payload: DisciplinaPayload,
): Promise<DisciplinaItem> {
  return apiEngine.semToast.put<DisciplinaItem>(`/disciplinas/${id}`, payload);
}

export async function listarProfessores(
  params: PaginacaoBuscaParams = {},
): Promise<RespostaPaginada<ProfessorItem>> {
  return apiEngine.semToast.get<RespostaPaginada<ProfessorItem>>("/professores", {
    params: montarQueryPaginada(params),
  });
}

export async function criarProfessor(
  payload: CriarProfessorPayload,
): Promise<ProfessorItem> {
  return apiEngine.semToast.post<ProfessorItem>("/professores", payload);
}

export async function desligarProfessor(id: number): Promise<void> {
  await apiEngine.semToast.delete<void>(`/professores/${id}`);
}

export async function listarAlunos(
  params: PaginacaoBuscaParams = {},
): Promise<RespostaPaginada<AlunoItem>> {
  return apiEngine.semToast.get<RespostaPaginada<AlunoItem>>("/alunos", {
    params: montarQueryPaginada(params),
  });
}

export async function criarAluno(payload: CriarAlunoPayload): Promise<AlunoItem> {
  return apiEngine.semToast.post<AlunoItem>("/alunos", payload);
}

export async function desligarAluno(id: number): Promise<void> {
  await apiEngine.semToast.delete<void>(`/alunos/${id}`);
}

export async function listarTurmas(
  params: PaginacaoBuscaParams = {},
): Promise<RespostaPaginada<TurmaSecretariaItem>> {
  return apiEngine.semToast.get<RespostaPaginada<TurmaSecretariaItem>>("/turmas", {
    params: montarQueryPaginada(params),
  });
}

export async function criarTurma(
  payload: CriarTurmaPayload,
): Promise<TurmaSecretariaItem> {
  return apiEngine.semToast.post<TurmaSecretariaItem>("/turmas", payload);
}

export async function atualizarVagasTurma(
  id: number,
  vagas: number,
): Promise<TurmaSecretariaItem> {
  return apiEngine.semToast.patch<TurmaSecretariaItem>(`/turmas/${id}/vagas`, { vagas });
}

export const secretariaService = {
  listarDisciplinas,
  criarDisciplina,
  atualizarDisciplina,
  listarProfessores,
  criarProfessor,
  desligarProfessor,
  listarAlunos,
  criarAluno,
  desligarAluno,
  listarTurmas,
  criarTurma,
  atualizarVagasTurma,
};
