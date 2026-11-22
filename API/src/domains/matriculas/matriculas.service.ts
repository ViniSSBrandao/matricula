import { StatusMatricula, TipoDisciplina } from "@prisma/client";
import { BusinessRuleError, NotFoundError } from "../../utils/errors.utils";
import { formatarSlotHorario, SlotHorario } from "../../utils/horario.utils";
import { ClassificacaoDisciplina, classificarDisciplina } from "../progresso/progresso.domain";
import { GradeSemanalDTO, montarGrade } from "./matriculas.domain";
import {
  buscarMatriculaPorId,
  cancelarMatricula,
  executarMatriculaComLock,
  listarMatriculasAtivasAluno,
} from "./matriculas.repository";

export interface HorarioMatriculaDTO extends SlotHorario {
  texto: string;
}

export interface MatriculaDTO {
  id: number;
  idTurma: number;
  status: StatusMatricula;
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
  horarios: HorarioMatriculaDTO[];
}

function mapearMatriculaParaDTO(
  matricula: Awaited<ReturnType<typeof executarMatriculaComLock>>["matricula"],
  mapaTipos: Map<number, TipoDisciplina>,
): MatriculaDTO {
  const classificacao = classificarDisciplina(
    mapaTipos.get(matricula.turma.disciplina.id) ?? null,
  );

  return {
    id: matricula.id,
    idTurma: matricula.idTurma,
    status: matricula.status,
    classificacao,
    disciplina: {
      id: matricula.turma.disciplina.id,
      codigo: matricula.turma.disciplina.codigo,
      nome: matricula.turma.disciplina.nome,
      cargaHoraria: matricula.turma.disciplina.cargaHoraria,
    },
    professor: {
      id: matricula.turma.professor.id,
      nome: matricula.turma.professor.nome,
      titulacao: matricula.turma.professor.titulacao,
    },
    horarios: matricula.turma.horarios.map((h) => ({
      dia: h.dia,
      inicio: h.inicio,
      fim: h.fim,
      texto: formatarSlotHorario(h),
    })),
  };
}

/**
 * Realiza a matrícula do aluno autenticado em uma turma aberta.
 */
export async function matricularAluno(idAluno: number, idTurma: number): Promise<MatriculaDTO> {
  const { matricula, vinculosCurso } = await executarMatriculaComLock(idAluno, idTurma);

  const mapaTipos = new Map<number, TipoDisciplina>();
  for (const vinculo of vinculosCurso) {
    mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
  }

  return mapearMatriculaParaDTO(matricula, mapaTipos);
}

/**
 * Lista todas as matrículas com status cursando do aluno autenticado.
 */
export async function obterMatriculasAtivas(idAluno: number): Promise<{ items: MatriculaDTO[] }> {
  const aluno = await listarMatriculasAtivasAluno(idAluno);
  if (!aluno) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const mapaTipos = new Map<number, TipoDisciplina>();
  for (const vinculo of aluno.curso.disciplinas) {
    mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
  }

  const items = aluno.matriculas.map((matricula) => mapearMatriculaParaDTO(matricula, mapaTipos));
  return { items };
}

/**
 * Monta a grade semanal do aluno autenticado a partir das matrículas com status cursando.
 */
export async function obterGradeSemanalAluno(idAluno: number): Promise<GradeSemanalDTO> {
  const aluno = await listarMatriculasAtivasAluno(idAluno);
  if (!aluno) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const mapaTipos = new Map<number, TipoDisciplina>();
  for (const vinculo of aluno.curso.disciplinas) {
    mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
  }

  const matriculasParaGrade = aluno.matriculas.map((matricula) => ({
    idMatricula: matricula.id,
    idTurma: matricula.idTurma,
    idDisciplina: matricula.turma.disciplina.id,
    disciplina: {
      codigo: matricula.turma.disciplina.codigo,
      nome: matricula.turma.disciplina.nome,
    },
    professor: {
      nome: matricula.turma.professor.nome,
    },
    horarios: matricula.turma.horarios,
  }));

  return montarGrade(matriculasParaGrade, mapaTipos);
}

/**
 * Cancela logicamente uma matrícula ativa pertencente ao aluno autenticado.
 */
export async function cancelarMatriculaAluno(idAluno: number, idMatricula: number): Promise<void> {
  const matricula = await buscarMatriculaPorId(idMatricula);
  if (!matricula || matricula.idAluno !== idAluno) {
    throw new NotFoundError("Matrícula não encontrada.");
  }

  if (matricula.status !== StatusMatricula.cursando) {
    throw new BusinessRuleError(
      "Apenas matrículas ativas podem ser canceladas.",
      "MATRICULA_NAO_ATIVA",
    );
  }

  await cancelarMatricula(idMatricula);
}
