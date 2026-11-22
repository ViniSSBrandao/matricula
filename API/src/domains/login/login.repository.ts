import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";
import { ConflictError } from "../../utils/errors.utils";

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

/**
 * Busca um professor pré-cadastrado pelo e-mail (case-insensitive).
 */
export async function buscarProfessorPorEmail(email: string) {
  try {
    return await prisma.professor.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      include: {
        cadastro: { select: { id: true } },
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca alunos pré-cadastrados por nome (case-insensitive) e curso.
 */
export async function buscarAlunosPorNomeECurso(nome: string, idCurso: number) {
  try {
    return await prisma.aluno.findMany({
      where: {
        idCurso,
        nome: { equals: nome, mode: "insensitive" },
      },
      include: {
        cadastro: { select: { id: true } },
      },
      orderBy: { id: "asc" },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Verifica se já existe cadastro usando o mesmo login ou e-mail.
 */
export async function buscarCadastroPorLoginOuEmail(login: string, email: string) {
  try {
    return await prisma.cadastro.findFirst({
      where: {
        OR: [
          { login: { equals: login, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Cria um registro de Cadastro vinculado a um aluno ou professor pré-cadastrado.
 */
export async function criarCadastroVinculado(dados: {
  login: string;
  email: string;
  idAluno?: number;
  idProfessor?: number;
}) {
  try {
    return await prisma.cadastro.create({
      data: {
        login: dados.login,
        email: dados.email,
        ...(dados.idAluno !== undefined ? { idAluno: dados.idAluno } : {}),
        ...(dados.idProfessor !== undefined ? { idProfessor: dados.idProfessor } : {}),
      },
      include: INCLUDE_CADASTRO_COMPLETO,
    });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      throw new ConflictError(
        "Login ou e-mail já está em uso.",
        undefined,
        "CADASTRO_DUPLICADO",
      );
    }
    throw normalizarErroParaHttp(erro);
  }
}
