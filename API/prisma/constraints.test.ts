import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../src/lib/prisma";

interface FixtureIds {
  cursoId: number;
  disciplinaId: number;
  professorId: number;
  alunoId: number;
  turmaId: number;
}

describe("Constraints do PostgreSQL", () => {
  const sufixo = `T${Date.now().toString().slice(-6)}`;
  const codigoBase = `TC${sufixo.slice(-5)}`;
  const emailProfessorBase = `prof.${sufixo}@teste.ufpe.br`;
  const fixtures: FixtureIds = {
    cursoId: 0,
    disciplinaId: 0,
    professorId: 0,
    alunoId: 0,
    turmaId: 0,
  };

  beforeAll(async () => {
    const curso = await prisma.curso.create({
      data: {
        nome: `Curso Constraint ${sufixo}`,
        chLivres: 60,
        chPerfil: 90,
      },
    });

    const disciplina = await prisma.disciplina.create({
      data: {
        codigo: codigoBase,
        nome: `Disciplina Constraint ${sufixo}`,
        cargaHoraria: 60,
      },
    });

    await prisma.disciplinaCurso.create({
      data: {
        idCurso: curso.id,
        idDisciplina: disciplina.id,
        tipo: TipoDisciplina.obrigatoria,
      },
    });

    const professor = await prisma.professor.create({
      data: {
        nome: `Professor Teste ${sufixo}`,
        titulacao: "Doutor",
        email: emailProfessorBase,
      },
    });

    const aluno = await prisma.aluno.create({
      data: {
        nome: `Aluno Teste ${sufixo}`,
        idCurso: curso.id,
      },
    });

    const turma = await prisma.turma.create({
      data: {
        idProfessor: professor.id,
        idDisciplina: disciplina.id,
        vagas: 10,
        status: StatusTurma.aberta,
      },
    });

    await prisma.alunosTurma.create({
      data: {
        idTurma: turma.id,
        idAluno: aluno.id,
        status: StatusMatricula.cursando,
      },
    });

    fixtures.cursoId = curso.id;
    fixtures.disciplinaId = disciplina.id;
    fixtures.professorId = professor.id;
    fixtures.alunoId = aluno.id;
    fixtures.turmaId = turma.id;
  });

  afterAll(async () => {
    if (fixtures.turmaId > 0) {
      await prisma.horariosTurma.deleteMany({ where: { idTurma: fixtures.turmaId } });
      await prisma.alunosTurma.deleteMany({ where: { idTurma: fixtures.turmaId } });
      await prisma.turma.deleteMany({ where: { id: fixtures.turmaId } });
    }
    if (fixtures.alunoId > 0) {
      await prisma.aluno.deleteMany({ where: { id: fixtures.alunoId } });
    }
    if (fixtures.professorId > 0) {
      await prisma.professor.deleteMany({ where: { id: fixtures.professorId } });
    }
    if (fixtures.cursoId > 0 && fixtures.disciplinaId > 0) {
      await prisma.disciplinaCurso.deleteMany({
        where: { idCurso: fixtures.cursoId, idDisciplina: fixtures.disciplinaId },
      });
    }
    if (fixtures.disciplinaId > 0) {
      await prisma.disciplina.deleteMany({ where: { id: fixtures.disciplinaId } });
    }
    if (fixtures.cursoId > 0) {
      await prisma.curso.deleteMany({ where: { id: fixtures.cursoId } });
    }
    await prisma.$disconnect();
  });

  it("rejeita código de disciplina duplicado", async () => {
    await expect(
      prisma.disciplina.create({
        data: {
          codigo: codigoBase,
          nome: "Disciplina Duplicada",
          cargaHoraria: 60,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejeita disciplina com carga_horaria = 20 (não múltipla de 15)", async () => {
    await expect(
      prisma.disciplina.create({
        data: {
          codigo: `X1${sufixo.slice(-5)}`,
          nome: "Disciplina CH 20",
          cargaHoraria: 20,
        },
      }),
    ).rejects.toThrow(/disciplinas_ch_valida|check constraint|23514/i);
  });

  it("rejeita disciplina com carga_horaria = 135 (maior que 120)", async () => {
    await expect(
      prisma.disciplina.create({
        data: {
          codigo: `X2${sufixo.slice(-5)}`,
          nome: "Disciplina CH 135",
          cargaHoraria: 135,
        },
      }),
    ).rejects.toThrow(/disciplinas_ch_valida|check constraint|23514/i);
  });

  it("rejeita e-mail de professor duplicado", async () => {
    await expect(
      prisma.professor.create({
        data: {
          nome: "Outro Professor",
          titulacao: "Doutor",
          email: emailProfessorBase,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejeita turma com 0 vagas", async () => {
    await expect(
      prisma.turma.create({
        data: {
          idProfessor: fixtures.professorId,
          idDisciplina: fixtures.disciplinaId,
          vagas: 0,
          status: StatusTurma.aberta,
        },
      }),
    ).rejects.toThrow(/turma_vagas_check|check constraint|23514/i);
  });

  it("rejeita disciplina_curso duplicado para o mesmo (curso, disciplina)", async () => {
    await expect(
      prisma.disciplinaCurso.create({
        data: {
          idCurso: fixtures.cursoId,
          idDisciplina: fixtures.disciplinaId,
          tipo: TipoDisciplina.perfil,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejeita cadastro sem nenhum perfil associado", async () => {
    await expect(
      prisma.cadastro.create({
        data: {
          login: `sem.perfil.${sufixo}`,
          email: `sem.perfil.${sufixo}@teste.ufpe.br`,
        },
      }),
    ).rejects.toThrow(/cadastro_um_perfil|check constraint|23514/i);
  });

  it("rejeita cadastro com dois perfis associados simultaneamente", async () => {
    await expect(
      prisma.cadastro.create({
        data: {
          login: `dois.perfis.${sufixo}`,
          email: `dois.perfis.${sufixo}@teste.ufpe.br`,
          idAluno: fixtures.alunoId,
          idProfessor: fixtures.professorId,
        },
      }),
    ).rejects.toThrow(/cadastro_um_perfil|check constraint|23514/i);
  });

  it("rejeita matrícula duplicada para o mesmo (aluno, turma)", async () => {
    await expect(
      prisma.alunosTurma.create({
        data: {
          idTurma: fixtures.turmaId,
          idAluno: fixtures.alunoId,
          status: StatusMatricula.cancelada,
        },
      }),
    ).rejects.toThrow();
  });

  it("rejeita horário com fim igual ao início", async () => {
    await expect(
      prisma.horariosTurma.create({
        data: {
          idTurma: fixtures.turmaId,
          dia: 1,
          inicio: 480,
          fim: 480,
        },
      }),
    ).rejects.toThrow(/horarios_turma_intervalo|check constraint|23514/i);
  });

  it("rejeita horário com fim menor que o início", async () => {
    await expect(
      prisma.horariosTurma.create({
        data: {
          idTurma: fixtures.turmaId,
          dia: 1,
          inicio: 600,
          fim: 540,
        },
      }),
    ).rejects.toThrow(/horarios_turma_intervalo|check constraint|23514/i);
  });
});
