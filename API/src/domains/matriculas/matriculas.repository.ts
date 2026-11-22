import { StatusMatricula, StatusTurma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { BusinessRuleError, NotFoundError } from "../../utils/errors.utils";
import { encontrarConflitoHorario } from "../../utils/horario.utils";

interface TurmaLockedRow {
  id: number;
  id_disciplina: number;
  id_professor: number;
  vagas: number;
  status: string;
}

const INCLUDE_TURMA_MATRICULA = {
  turma: {
    include: {
      disciplina: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          cargaHoraria: true,
        },
      },
      professor: {
        select: {
          id: true,
          nome: true,
          titulacao: true,
        },
      },
      horarios: {
        select: {
          dia: true,
          inicio: true,
          fim: true,
        },
        orderBy: [{ dia: "asc" as const }, { inicio: "asc" as const }],
      },
    },
  },
};

/**
 * Efetua matrícula de aluno em turma dentro de transação com lock pessimista (FOR UPDATE)
 * para garantir consistência de vagas sob concorrência.
 */
export async function executarMatriculaComLock(idAluno: number, idTurma: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const turmasLocked = await tx.$queryRaw<TurmaLockedRow[]>`
        SELECT id, id_disciplina, id_professor, vagas, status::text AS status
        FROM turma
        WHERE id = ${idTurma}
        FOR UPDATE
      `;

      const turmaLocked = turmasLocked[0];
      if (!turmaLocked) {
        throw new NotFoundError("Turma não encontrada.");
      }

      if (turmaLocked.status !== StatusTurma.aberta) {
        throw new BusinessRuleError("Turma encerrada para matrículas.", "TURMA_ENCERRADA");
      }

      const aluno = await tx.aluno.findUnique({
        where: { id: idAluno },
        include: {
          curso: {
            include: {
              disciplinas: {
                select: {
                  idDisciplina: true,
                  tipo: true,
                },
              },
            },
          },
          matriculas: {
            include: {
              turma: {
                include: {
                  disciplina: {
                    select: {
                      id: true,
                      codigo: true,
                      nome: true,
                    },
                  },
                  horarios: {
                    select: {
                      dia: true,
                      inicio: true,
                      fim: true,
                    },
                    orderBy: [{ dia: "asc" }, { inicio: "asc" }],
                  },
                },
              },
            },
          },
        },
      });

      if (!aluno) {
        throw new NotFoundError("Aluno não encontrado.");
      }

      const matriculasCursando = aluno.matriculas.filter(
        (m) => m.status === StatusMatricula.cursando,
      );

      const jaCursandoMesmaDisciplina = matriculasCursando.some(
        (m) =>
          m.idTurma === turmaLocked.id || m.turma.idDisciplina === turmaLocked.id_disciplina,
      );
      if (jaCursandoMesmaDisciplina) {
        throw new BusinessRuleError(
          "Aluno já está matriculado nesta disciplina.",
          "MATRICULA_DUPLICADA",
        );
      }

      const jaAprovado = aluno.matriculas.some(
        (m) =>
          m.status === StatusMatricula.aprovado &&
          m.turma.idDisciplina === turmaLocked.id_disciplina,
      );
      if (jaAprovado) {
        throw new BusinessRuleError(
          "Aluno já foi aprovado nesta disciplina.",
          "JA_APROVADO_NA_DISCIPLINA",
        );
      }

      const ocupadas = await tx.alunosTurma.count({
        where: {
          idTurma: turmaLocked.id,
          status: StatusMatricula.cursando,
        },
      });
      if (ocupadas >= turmaLocked.vagas) {
        throw new BusinessRuleError("Turma lotada.", "TURMA_LOTADA");
      }

      const horariosNovaTurma = await tx.horariosTurma.findMany({
        where: { idTurma: turmaLocked.id },
        select: {
          dia: true,
          inicio: true,
          fim: true,
        },
        orderBy: [{ dia: "asc" }, { inicio: "asc" }],
      });

      const turmasAtivasParaConflito = matriculasCursando.map((m) => ({
        horarios: m.turma.horarios,
        disciplina: m.turma.disciplina,
      }));

      const turmaConflitante = encontrarConflitoHorario(
        horariosNovaTurma,
        turmasAtivasParaConflito,
      );
      if (turmaConflitante) {
        throw new BusinessRuleError(
          `Conflito de horário com a disciplina ${turmaConflitante.disciplina.codigo} - ${turmaConflitante.disciplina.nome}.`,
          "CONFLITO_DE_HORARIO",
        );
      }

      const matriculaExistenteNaTurma = aluno.matriculas.find(
        (m) => m.idTurma === turmaLocked.id,
      );

      const matricula =
        matriculaExistenteNaTurma && matriculaExistenteNaTurma.status === StatusMatricula.cancelada
          ? await tx.alunosTurma.update({
              where: { id: matriculaExistenteNaTurma.id },
              data: { status: StatusMatricula.cursando },
              include: INCLUDE_TURMA_MATRICULA,
            })
          : await tx.alunosTurma.create({
              data: {
                idAluno,
                idTurma: turmaLocked.id,
                status: StatusMatricula.cursando,
              },
              include: INCLUDE_TURMA_MATRICULA,
            });

      return {
        matricula,
        vinculosCurso: aluno.curso.disciplinas,
      };
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca todas as matrículas ativas (status cursando) de um aluno junto à estrutura curricular do seu curso.
 */
export async function listarMatriculasAtivasAluno(idAluno: number) {
  try {
    return await prisma.aluno.findUnique({
      where: { id: idAluno },
      include: {
        curso: {
          include: {
            disciplinas: {
              select: {
                idDisciplina: true,
                tipo: true,
              },
            },
          },
        },
        matriculas: {
          where: {
            status: StatusMatricula.cursando,
          },
          orderBy: { id: "asc" },
          include: INCLUDE_TURMA_MATRICULA,
        },
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca uma matrícula pelo seu ID.
 */
export async function buscarMatriculaPorId(idMatricula: number) {
  try {
    return await prisma.alunosTurma.findUnique({
      where: { id: idMatricula },
      select: {
        id: true,
        idAluno: true,
        idTurma: true,
        status: true,
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Realiza o cancelamento lógico de uma matrícula alterando o status para cancelada.
 */
export async function cancelarMatricula(idMatricula: number) {
  try {
    return await prisma.alunosTurma.update({
      where: { id: idMatricula },
      data: { status: StatusMatricula.cancelada },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
