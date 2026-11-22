import { PrismaClient } from "@prisma/client";

export interface ContagemTabelas {
  disciplinas: number;
  cursos: number;
  disciplinaCurso: number;
  professor: number;
  servidor: number;
  aluno: number;
  cadastro: number;
  turma: number;
  alunosTurma: number;
  horariosTurma: number;
}

const TABELAS_TRUNCATE = [
  "horarios_turma",
  "alunos_turma",
  "turma",
  "cadastro",
  "aluno",
  "servidor",
  "professor",
  "disciplina_curso",
  "cursos",
  "disciplinas",
] as const;

/**
 * Impede a execução de operações destrutivas (reset/seed) em ambiente de produção.
 */
export function assertAmbienteNaoProducao(nodeEnv: string | undefined = process.env.NODE_ENV): void {
  if (nodeEnv?.trim().toLowerCase() === "production") {
    throw new Error("Operação abortada: não é permitido executar limpeza/seed com NODE_ENV=production.");
  }
}

/**
 * Limpa todas as tabelas do banco e reinicia os sequences (IDENTITY) de forma determinística.
 */
export async function limparBancoDeDados(prisma: PrismaClient): Promise<void> {
  assertAmbienteNaoProducao();
  const listaTabelas = TABELAS_TRUNCATE.map((tabela) => `"${tabela}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${listaTabelas} RESTART IDENTITY CASCADE;`);
}

/**
 * Coleta a contagem de registros de todas as tabelas do esquema em paralelo.
 */
export async function coletarContagemTabelas(prisma: PrismaClient): Promise<ContagemTabelas> {
  const [
    disciplinas,
    cursos,
    disciplinaCurso,
    professor,
    servidor,
    aluno,
    cadastro,
    turma,
    alunosTurma,
    horariosTurma,
  ] = await Promise.all([
    prisma.disciplina.count(),
    prisma.curso.count(),
    prisma.disciplinaCurso.count(),
    prisma.professor.count(),
    prisma.servidor.count(),
    prisma.aluno.count(),
    prisma.cadastro.count(),
    prisma.turma.count(),
    prisma.alunosTurma.count(),
    prisma.horariosTurma.count(),
  ]);

  return {
    disciplinas,
    cursos,
    disciplinaCurso,
    professor,
    servidor,
    aluno,
    cadastro,
    turma,
    alunosTurma,
    horariosTurma,
  };
}
