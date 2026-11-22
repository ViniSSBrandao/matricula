import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { ConflictError, NotFoundError } from "../../utils/errors.utils";
import { DisciplinaBody, ListarDisciplinasQuery } from "./disciplinas.schema";

/**
 * Lista disciplinas paginadas com filtro case-insensitive por código ou nome.
 */
export async function listarDisciplinasPaginadas(query: ListarDisciplinasQuery) {
  try {
    const where: Prisma.DisciplinaWhereInput = query.search
      ? {
          OR: [
            { codigo: { contains: query.search, mode: "insensitive" } },
            { nome: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.disciplina.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { id: "asc" },
      }),
      prisma.disciplina.count({ where }),
    ]);

    return { items, total };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Cria uma nova disciplina convertendo violação de código único em ConflictError específico.
 */
export async function criarDisciplina(dados: DisciplinaBody) {
  try {
    return await prisma.disciplina.create({
      data: dados,
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ConflictError(
        "Já existe uma disciplina cadastrada com este código.",
        undefined,
        "DISCIPLINA_CODIGO_DUPLICADO",
      );
    }
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Atualiza uma disciplina existente por ID.
 */
export async function atualizarDisciplina(id: number, dados: DisciplinaBody) {
  try {
    return await prisma.disciplina.update({
      where: { id },
      data: dados,
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === "P2002") {
        throw new ConflictError(
          "Já existe uma disciplina cadastrada com este código.",
          undefined,
          "DISCIPLINA_CODIGO_DUPLICADO",
        );
      }
      if (erro.code === "P2025") {
        throw new NotFoundError("Disciplina não encontrada.");
      }
    }
    throw normalizarErroParaHttp(erro);
  }
}
