import { Prisma, StatusMatricula } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { BusinessRuleError, NotFoundError } from "../../utils/errors.utils";
import { CriarTurmaBody, ListarTurmasQuery } from "./turmas.schema";

interface TurmaLockedRow {
  id: number;
  vagas: number;
  status: string;
}

const INCLUDE_TURMA_DETALHES = {
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
      email: true,
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
};

/**
 * Lista todas as turmas paginadas com disciplina, professor, horários e ocupação atual.
 */
export async function listarTurmasPaginadas(query: ListarTurmasQuery) {
  try {
    const where: Prisma.TurmaWhereInput = query.search
      ? {
          OR: [
            { disciplina: { nome: { contains: query.search, mode: "insensitive" } } },
            { disciplina: { codigo: { contains: query.search, mode: "insensitive" } } },
            { professor: { nome: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [turmas, total] = await Promise.all([
      prisma.turma.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: "asc" },
        include: {
          ...INCLUDE_TURMA_DETALHES,
          matriculas: {
            where: {
              status: StatusMatricula.cursando,
            },
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.turma.count({ where }),
    ]);

    return { turmas, total };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Cria uma nova turma após validar a existência da disciplina e do professor informados.
 */
export async function criarTurma(dados: CriarTurmaBody) {
  try {
    const [disciplina, professor] = await Promise.all([
      prisma.disciplina.findUnique({
        where: { id: dados.idDisciplina },
        select: { id: true },
      }),
      prisma.professor.findUnique({
        where: { id: dados.idProfessor },
        select: { id: true },
      }),
    ]);

    if (!disciplina) {
      throw new NotFoundError("Disciplina não encontrada.");
    }
    if (!professor) {
      throw new NotFoundError("Professor não encontrado.");
    }

    return await prisma.turma.create({
      data: {
        idDisciplina: dados.idDisciplina,
        idProfessor: dados.idProfessor,
        vagas: dados.vagas,
        ...(dados.horarios.length > 0
          ? {
              horarios: {
                create: dados.horarios,
              },
            }
          : {}),
      },
      include: INCLUDE_TURMA_DETALHES,
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Atualiza a quantidade de vagas de uma turma dentro de transação com lock na linha (FOR UPDATE).
 */
export async function atualizarVagasComLock(idTurma: number, novasVagas: number) {
  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<TurmaLockedRow[]>`
        SELECT id, vagas, status::text AS status
        FROM turma
        WHERE id = ${idTurma}
        FOR UPDATE
      `;

      const turmaLocked = rows[0];
      if (!turmaLocked) {
        throw new NotFoundError("Turma não encontrada.");
      }

      const ocupadas = await tx.alunosTurma.count({
        where: {
          idTurma: turmaLocked.id,
          status: StatusMatricula.cursando,
        },
      });

      if (novasVagas < ocupadas) {
        throw new BusinessRuleError(
          "O número de vagas não pode ser menor que a quantidade de alunos cursando.",
          "VAGAS_ABAIXO_DE_MATRICULADOS",
        );
      }

      const turma = await tx.turma.update({
        where: { id: idTurma },
        data: { vagas: novasVagas },
        include: INCLUDE_TURMA_DETALHES,
      });

      return { turma, ocupadas };
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
