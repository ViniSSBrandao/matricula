import { StatusMatricula } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";

/**
 * Busca os dados curriculares do curso e as matrículas relevantes (aprovadas e em curso) do aluno.
 */
export async function buscarDadosProgressoAluno(idAluno: number) {
  try {
    return await prisma.aluno.findUnique({
      where: { id: idAluno },
      include: {
        curso: {
          include: {
            disciplinas: {
              include: {
                disciplina: {
                  select: {
                    cargaHoraria: true,
                  },
                },
              },
            },
          },
        },
        matriculas: {
          where: {
            status: {
              in: [StatusMatricula.aprovado, StatusMatricula.cursando],
            },
          },
          include: {
            turma: {
              include: {
                disciplina: {
                  select: {
                    id: true,
                    cargaHoraria: true,
                  },
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
