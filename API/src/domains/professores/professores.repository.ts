import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "../../utils/errors.utils";
import { CriarProfessorBody, ListarProfessoresQuery } from "./professores.schema";

/**
 * Lista professores paginados com filtro case-insensitive opcional por nome, e-mail ou titulação.
 */
export async function listarProfessoresPaginados(query: ListarProfessoresQuery) {
  try {
    const where: Prisma.ProfessorWhereInput = query.search
      ? {
          OR: [
            { nome: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { titulacao: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.professor.findMany({
        where,
        include: {
          cadastro: { select: { login: true } },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: "asc" },
      }),
      prisma.professor.count({ where }),
    ]);

    return { items, total };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Cria um novo professor convertendo violação de e-mail único em ConflictError específico.
 */
export async function criarProfessor(dados: CriarProfessorBody) {
  try {
    return await prisma.professor.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        ...(dados.titulacao !== undefined ? { titulacao: dados.titulacao } : {}),
      },
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ConflictError(
        "Já existe um professor cadastrado com este e-mail.",
        undefined,
        "PROFESSOR_EMAIL_DUPLICADO",
      );
    }
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Desliga um professor (e seu cadastro vinculado, se houver), desde que não possua turmas vinculadas.
 */
export async function desligarProfessorPorId(id: number): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const professor = await tx.professor.findUnique({
        where: { id },
        include: {
          cadastro: { select: { id: true } },
          _count: { select: { turmas: true } },
        },
      });

      if (!professor) {
        throw new NotFoundError("Professor não encontrado.");
      }

      if (professor._count.turmas > 0) {
        throw new BusinessRuleError(
          "Não é possível desligar professor com turmas vinculadas.",
          "PROFESSOR_POSSUI_TURMAS",
        );
      }

      if (professor.cadastro) {
        await tx.cadastro.delete({ where: { id: professor.cadastro.id } });
      }

      await tx.professor.delete({ where: { id } });
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
