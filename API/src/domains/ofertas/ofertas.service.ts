import { StatusMatricula, TipoDisciplina } from "@prisma/client";
import { NotFoundError } from "../../utils/errors.utils";
import {
  encontrarConflitoHorario,
  formatarSlotHorario,
  SlotHorario,
} from "../../utils/horario.utils";
import { buildPaginatedResponse, PaginatedResponse } from "../../utils/pagination.utils";
import { ClassificacaoDisciplina, classificarDisciplina } from "../progresso/progresso.domain";
import { buscarContextoAlunoOfertas, buscarTurmasAbertasPaginadas } from "./ofertas.repository";
import { OfertasQuery } from "./ofertas.schema";

export interface HorarioOfertaDTO extends SlotHorario {
  texto: string;
}

export interface OfertaTurmaDTO {
  id: number;
  vagas: number;
  ocupadas: number;
  vagasDisponiveis: number;
  classificacao: ClassificacaoDisciplina;
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
  };
  horarios: HorarioOfertaDTO[];
  jaMatriculado: boolean;
  jaAprovado: boolean;
  conflitaComHorario: boolean;
}

/**
 * Lista turmas abertas enriquecidas com classificação curricular, vagas disponíveis e flags de UI.
 */
export async function listarOfertasParaAluno(
  idAluno: number,
  query: OfertasQuery,
): Promise<PaginatedResponse<OfertaTurmaDTO>> {
  const contexto = await buscarContextoAlunoOfertas(idAluno);
  if (!contexto) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const { turmas, total } = await buscarTurmasAbertasPaginadas(query);

  const mapaTipos = new Map<number, TipoDisciplina>();
  for (const vinculo of contexto.curso.disciplinas) {
    mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
  }

  const matriculasCursando = contexto.matriculas.filter(
    (m) => m.status === StatusMatricula.cursando,
  );
  const turmasCursando = matriculasCursando.map((m) => m.turma);
  const idsTurmasCursando = new Set(turmasCursando.map((t) => t.id));
  const idsDisciplinasCursando = new Set(turmasCursando.map((t) => t.idDisciplina));
  const idsDisciplinasAprovadas = new Set(
    contexto.matriculas
      .filter((m) => m.status === StatusMatricula.aprovado)
      .map((m) => m.turma.idDisciplina),
  );

  const items: OfertaTurmaDTO[] = turmas.map((turma) => {
    const ocupadas = turma.matriculas.length;
    const vagasDisponiveis = Math.max(0, turma.vagas - ocupadas);
    const classificacao = classificarDisciplina(mapaTipos.get(turma.disciplina.id) ?? null);
    const jaMatriculadoNaTurma = idsTurmasCursando.has(turma.id);
    const jaMatriculado = idsDisciplinasCursando.has(turma.disciplina.id);
    const jaAprovado = idsDisciplinasAprovadas.has(turma.disciplina.id);

    const conflitaComHorario =
      jaMatriculadoNaTurma || turma.horarios.length === 0
        ? false
        : Boolean(encontrarConflitoHorario(turma.horarios, turmasCursando));

    return {
      id: turma.id,
      vagas: turma.vagas,
      ocupadas,
      vagasDisponiveis,
      classificacao,
      disciplina: {
        id: turma.disciplina.id,
        codigo: turma.disciplina.codigo,
        nome: turma.disciplina.nome,
        cargaHoraria: turma.disciplina.cargaHoraria,
      },
      professor: {
        id: turma.professor.id,
        nome: turma.professor.nome,
        titulacao: turma.professor.titulacao,
      },
      horarios: turma.horarios.map((h) => ({
        dia: h.dia,
        inicio: h.inicio,
        fim: h.fim,
        texto: formatarSlotHorario(h),
      })),
      jaMatriculado,
      jaAprovado,
      conflitaComHorario,
    };
  });

  return buildPaginatedResponse(items, total, query.page, query.pageSize);
}
