import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";

const INCLUDE_CADASTRO_COMPLETO = {
  aluno: { include: { curso: true } },
  professor: true,
  servidor: true,
} as const;

/**
 * Busca todos os cadastros com os respectivos vínculos de perfil ordenados por ID.
 */
export async function buscarTodosCadastrosComRelacoes() {
  try {
    return await prisma.cadastro.findMany({
      include: INCLUDE_CADASTRO_COMPLETO,
      orderBy: { id: "asc" },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca um cadastro específico pelo nome de usuário (login).
 */
export async function buscarCadastroPorLogin(login: string) {
  try {
    return await prisma.cadastro.findUnique({
      where: { login },
      include: INCLUDE_CADASTRO_COMPLETO,
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
