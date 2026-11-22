import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { ConflictError } from "../../utils/errors.utils";
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
