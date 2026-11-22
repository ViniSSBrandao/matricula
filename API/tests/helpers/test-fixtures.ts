import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/lib/prisma";

/**
 * Limpa todas as tabelas do banco de testes e reinicia as sequências de ID.
 */
export async function limparBancoDeTestes(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      horarios_turma,
      alunos_turma,
      turma,
      disciplina_curso,
      cadastro,
      aluno,
      professor,
      servidor,
      disciplinas,
      cursos
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Autentica pela rota real de login e retorna o token JWT emitido.
 */
export async function loginComo(login: string): Promise<string> {
  const res = await request(app).post("/auth/login").send({ login });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Falha ao autenticar usuário de teste "${login}": ${res.status}`);
  }
  return res.body.token as string;
}
