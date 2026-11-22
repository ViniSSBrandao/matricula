import { StatusTurma } from "@prisma/client";
import { formatarSlotHorario, SlotHorario } from "../../utils/horario.utils";
import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import {
  atualizarVagasComLock,
  criarTurma,
  listarTurmasPaginadas,
} from "./turmas.repository";
import { CriarTurmaBody, ListarTurmasQuery } from "./turmas.schema";

export interface HorarioTurmaDTO extends SlotHorario {
  texto: string;
}

export interface TurmaDTO {
  id: number;
  vagas: number;
  ocupadas: number;
  vagasDisponiveis: number;
  status: StatusTurma;
  disciplina: {
    id: number;
    codigo: string;
    nome: string;
    cargaHoraria: number;
  };
  professor: {
    id: number;
    nome: string;
    titulacao: string;
    email: string;
  };
  horarios: HorarioTurmaDTO[];
}

function mapearTurmaParaDTO(
  turma: Awaited<ReturnType<typeof criarTurma>>,
  ocupadas: number,
): TurmaDTO {
  return {
    id: turma.id,
    vagas: turma.vagas,
    ocupadas,
    vagasDisponiveis: Math.max(0, turma.vagas - ocupadas),
    status: turma.status,
    disciplina: turma.disciplina,
    professor: turma.professor,
    horarios: turma.horarios.map((h) => ({
      dia: h.dia,
      inicio: h.inicio,
      fim: h.fim,
      texto: formatarSlotHorario(h),
    })),
  };
}

/**
 * Lista turmas com paginação, vagas totais, ocupadas e dados relacionados.
 */
export async function obterTurmas(
  query: ListarTurmasQuery,
): Promise<PaginatedResponse<TurmaDTO>> {
  const { turmas, total } = await listarTurmasPaginadas(query);
  const items = turmas.map((turma) => mapearTurmaParaDTO(turma, turma.matriculas.length));
  return buildPaginatedResponse(items, total, query.page, query.pageSize);
}

/**
 * Cadastra uma nova turma aberta com horários opcionais.
 */
export async function cadastrarTurma(dados: CriarTurmaBody): Promise<TurmaDTO> {
  const turma = await criarTurma(dados);
  return mapearTurmaParaDTO(turma, 0);
}

/**
 * Atualiza a quantidade de vagas de uma turma respeitando o total já ocupado.
 */
export async function atualizarVagasTurma(
  idTurma: number,
  novasVagas: number,
): Promise<TurmaDTO> {
  const { turma, ocupadas } = await atualizarVagasComLock(idTurma, novasVagas);
  return mapearTurmaParaDTO(turma, ocupadas);
}
