import { Prisma, StatusMatricula, StatusTurma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { OfertasQuery } from "./ofertas.schema";

/**
 * Busca o curso, a estrutura curricular e as matrículas ativas/aprovadas do aluno.
 */
export async function buscarContextoAlunoOfertas(idAluno: number) {
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
            status: {
              in: [StatusMatricula.cursando, StatusMatricula.aprovado],
            },
          },
          include: {
            turma: {
              select: {
                id: true,
                idDisciplina: true,
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
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Lista turmas abertas com paginação e filtro textual por código/nome da disciplina ou nome do professor.
 */
export async function buscarTurmasAbertasPaginadas(query: OfertasQuery) {
  try {
    const where: Prisma.TurmaWhereInput = {
      status: StatusTurma.aberta,
      ...(query.search
        ? {
            OR: [
              { disciplina: { nome: { contains: query.search, mode: "insensitive" } } },
              { disciplina: { codigo: { contains: query.search, mode: "insensitive" } } },
              { professor: { nome: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [turmas, total] = await Promise.all([
      prisma.turma.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: "asc" },
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
            orderBy: [{ dia: "asc" }, { inicio: "asc" }],
          },
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
