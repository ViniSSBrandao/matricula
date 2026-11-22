import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { BusinessRuleError, NotFoundError } from "../../utils/errors.utils";
import { CriarAlunoBody, ListarAlunosQuery } from "./alunos.schema";

/**
 * Lista alunos paginados com busca opcional por nome ou curso.
 */
export async function listarAlunosPaginados(query: ListarAlunosQuery) {
  try {
    const where: Prisma.AlunoWhereInput = query.search
      ? {
          OR: [
            { nome: { contains: query.search, mode: "insensitive" } },
            { curso: { nome: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        include: {
          curso: { select: { id: true, nome: true } },
          cadastro: { select: { login: true, email: true } },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: "asc" },
      }),
      prisma.aluno.count({ where }),
    ]);

    return { items, total };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Cria um novo aluno vinculado a um curso existente.
 */
export async function criarAluno(dados: CriarAlunoBody) {
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: dados.idCurso },
      select: { id: true },
    });

    if (!curso) {
      throw new NotFoundError("Curso não encontrado.");
    }

    return await prisma.aluno.create({
      data: {
        nome: dados.nome,
        idCurso: dados.idCurso,
      },
      include: {
        curso: { select: { id: true, nome: true } },
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Desliga um aluno (e seu cadastro vinculado, se houver), desde que não possua matrículas vinculadas.
 */
export async function desligarAlunoPorId(id: number): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const aluno = await tx.aluno.findUnique({
        where: { id },
        include: {
          cadastro: { select: { id: true } },
          _count: { select: { matriculas: true } },
        },
      });

      if (!aluno) {
        throw new NotFoundError("Aluno não encontrado.");
      }

      if (aluno._count.matriculas > 0) {
        throw new BusinessRuleError(
          "Não é possível desligar aluno com matrículas vinculadas.",
          "ALUNO_POSSUI_MATRICULAS",
        );
      }

      if (aluno.cadastro) {
        await tx.cadastro.delete({ where: { id: aluno.cadastro.id } });
      }

      await tx.aluno.delete({ where: { id } });
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
