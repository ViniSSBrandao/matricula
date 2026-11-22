import { StatusMatricula, StatusTurma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { normalizarErroParaHttp } from "../../utils/error-mapper.utils";

/**
 * Busca um cadastro completo por ID com os respectivos vínculos de perfil.
 */
export async function buscarCadastroPorId(idCadastro: number) {
  try {
    return await prisma.cadastro.findUnique({
      where: { id: idCadastro },
      include: {
        aluno: { include: { curso: true } },
        professor: true,
        servidor: true,
      },
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca os vínculos curriculares do curso e as matrículas do aluno.
 */
export async function buscarDadosAcademicosAluno(idAluno: number, idCurso: number) {
  try {
    const [vinculosCurso, matriculas] = await Promise.all([
      prisma.disciplinaCurso.findMany({
        where: { idCurso },
        include: { disciplina: true },
      }),
      prisma.alunosTurma.findMany({
        where: { idAluno },
        include: {
          turma: {
            include: {
              disciplina: true,
              professor: true,
              horarios: { orderBy: [{ dia: "asc" }, { inicio: "asc" }] },
            },
          },
        },
        orderBy: { id: "asc" },
      }),
    ]);

    return { vinculosCurso, matriculas };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca todas as turmas atribuídas a um professor com horários e status das matrículas.
 */
export async function buscarTurmasDoProfessor(idProfessor: number) {
  try {
    return await prisma.turma.findMany({
      where: { idProfessor },
      include: {
        disciplina: true,
        horarios: { orderBy: [{ dia: "asc" }, { inicio: "asc" }] },
        matriculas: { select: { status: true } },
      },
      orderBy: [{ status: "asc" }, { id: "asc" }],
    });
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}

/**
 * Busca métricas gerais do sistema, resumo dos cursos e turmas abertas para a secretaria.
 */
export async function buscarDadosConsolidadosSecretaria() {
  try {
    const [
      totalCursos,
      totalDisciplinas,
      totalAlunos,
      totalProfessores,
      totalProfessoresSemCadastro,
      totalTurmasAbertas,
      totalTurmasEncerradas,
      cursos,
      turmasAbertas,
    ] = await Promise.all([
      prisma.curso.count(),
      prisma.disciplina.count(),
      prisma.aluno.count(),
      prisma.professor.count(),
      prisma.professor.count({ where: { cadastro: { is: null } } }),
      prisma.turma.count({ where: { status: StatusTurma.aberta } }),
      prisma.turma.count({ where: { status: StatusTurma.encerrada } }),
      prisma.curso.findMany({
        include: {
          _count: {
            select: { alunos: true, disciplinas: true },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.turma.findMany({
        where: { status: StatusTurma.aberta },
        include: {
          disciplina: true,
          professor: true,
          horarios: { orderBy: [{ dia: "asc" }, { inicio: "asc" }] },
          matriculas: {
            where: { status: StatusMatricula.cursando },
            select: { id: true },
          },
        },
        orderBy: { id: "asc" },
      }),
    ]);

    return {
      metricas: {
        cursos: totalCursos,
        disciplinas: totalDisciplinas,
        alunos: totalAlunos,
        professores: totalProfessores,
        professoresSemCadastro: totalProfessoresSemCadastro,
        turmasAbertas: totalTurmasAbertas,
        turmasEncerradas: totalTurmasEncerradas,
      },
      cursos,
      turmasAbertas,
    };
  } catch (erro) {
    throw normalizarErroParaHttp(erro);
  }
}
