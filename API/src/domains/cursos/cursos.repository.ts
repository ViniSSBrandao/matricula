import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";

/**
 * Lista todos os cursos ordenados por nome.
 */
export async function listarTodosCursos() {
  try {
    return await prisma.curso.findMany({
      orderBy: { nome: "asc" },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
