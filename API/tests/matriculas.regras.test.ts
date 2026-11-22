import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { limparBancoDeTestes, loginComo } from "./helpers/test-fixtures";

describe("Regras de negócio — Matrícula e Choque de Horário (Regras 6 a 9 + Extra)", () => {
  let tokenAna: string;
  let tokenBruno: string;
  let anaId: number;
  let brunoId: number;
  let profId: number;
  let discAId: number;
  let discBId: number;
  let discCId: number;

  beforeEach(async () => {
    await limparBancoDeTestes();

    const curso = await prisma.curso.create({
      data: { nome: "Ciência da Computação", chPerfil: 120, chLivres: 60 },
    });

    const [ana, bruno] = await Promise.all([
      prisma.aluno.create({ data: { nome: "Ana", idCurso: curso.id } }),
      prisma.aluno.create({ data: { nome: "Bruno", idCurso: curso.id } }),
    ]);
    anaId = ana.id;
    brunoId = bruno.id;

    await prisma.cadastro.createMany({
      data: [
        { login: "ana.cc", email: "ana.cc@ufpe.br", idAluno: ana.id },
        { login: "bruno.cc", email: "bruno.cc@ufpe.br", idAluno: bruno.id },
      ],
    });

    const prof = await prisma.professor.create({
      data: { nome: "Prof. Ricardo", email: "ricardo@ufpe.br", titulacao: "Doutor" },
    });
    profId = prof.id;

    const [discA, discB, discC] = await Promise.all([
      prisma.disciplina.create({ data: { codigo: "IF668", nome: "Introdução", cargaHoraria: 60 } }),
      prisma.disciplina.create({ data: { codigo: "IF669", nome: "Algoritmos", cargaHoraria: 60 } }),
      prisma.disciplina.create({ data: { codigo: "IF670", nome: "Lógica", cargaHoraria: 60 } }),
    ]);
    discAId = discA.id;
    discBId = discB.id;
    discCId = discC.id;

    await prisma.disciplinaCurso.create({
      data: { idCurso: curso.id, idDisciplina: discA.id, tipo: TipoDisciplina.obrigatoria },
    });

    tokenAna = await loginComo("ana.cc");
    tokenBruno = await loginComo("bruno.cc");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Regra 6: impede matrícula em turma lotada", async () => {
    const turma = await prisma.turma.create({
      data: { idDisciplina: discAId, idProfessor: profId, vagas: 1, status: StatusTurma.aberta },
    });

    const resAna = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turma.id });
    expect(resAna.status).toBe(201);

    const resBruno = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenBruno}`)
      .send({ idTurma: turma.id });

    expect(resBruno.status).toBe(422);
    expect(resBruno.body.code).toBe("TURMA_LOTADA");
  });

  it("Regra 7: impede matrícula em disciplina já aprovada e permite refazer disciplina reprovada", async () => {
    const turmaAnteriorA = await prisma.turma.create({
      data: { idDisciplina: discAId, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada },
    });
    const turmaAnteriorB = await prisma.turma.create({
      data: { idDisciplina: discBId, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada },
    });

    await prisma.alunosTurma.createMany({
      data: [
        { idTurma: turmaAnteriorA.id, idAluno: anaId, status: StatusMatricula.aprovado },
        { idTurma: turmaAnteriorB.id, idAluno: anaId, status: StatusMatricula.reprovado },
      ],
    });

    const turmaAtualA = await prisma.turma.create({
      data: { idDisciplina: discAId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
    });
    const turmaAtualB = await prisma.turma.create({
      data: { idDisciplina: discBId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
    });

    const tentativaAprovada = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaAtualA.id });

    expect(tentativaAprovada.status).toBe(422);
    expect(tentativaAprovada.body.code).toBe("JA_APROVADO_NA_DISCIPLINA");

    const tentativaReprovada = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaAtualB.id });

    expect(tentativaReprovada.status).toBe(201);
    expect(tentativaReprovada.body.status).toBe("cursando");
  });

  it("Regra 8: cancelar matrícula ativa devolve a vaga para a turma", async () => {
    const turma = await prisma.turma.create({
      data: { idDisciplina: discAId, idProfessor: profId, vagas: 1, status: StatusTurma.aberta },
    });

    const matriculaAna = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turma.id });
    expect(matriculaAna.status).toBe(201);

    const brunoAntes = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenBruno}`)
      .send({ idTurma: turma.id });
    expect(brunoAntes.status).toBe(422);

    const cancelamento = await request(app)
      .delete(`/matriculas/${matriculaAna.body.id}`)
      .set("Authorization", `Bearer ${tokenAna}`);
    expect(cancelamento.status).toBe(204);

    const segundaTentativaCancelamento = await request(app)
      .delete(`/matriculas/${matriculaAna.body.id}`)
      .set("Authorization", `Bearer ${tokenAna}`);
    expect(segundaTentativaCancelamento.status).toBe(422);
    expect(segundaTentativaCancelamento.body.code).toBe("MATRICULA_NAO_ATIVA");

    const brunoDepois = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenBruno}`)
      .send({ idTurma: turma.id });
    expect(brunoDepois.status).toBe(201);
  });

  it("Regra 9: aluno só vê e altera as próprias matrículas", async () => {
    const turmaA = await prisma.turma.create({
      data: { idDisciplina: discAId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
    });
    const turmaB = await prisma.turma.create({
      data: { idDisciplina: discBId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
    });

    const matAna = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaA.id });
    expect(matAna.status).toBe(201);

    await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenBruno}`)
      .send({ idTurma: turmaB.id });

    const listaAna = await request(app)
      .get("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`);

    expect(listaAna.status).toBe(200);
    expect(listaAna.body.items).toHaveLength(1);
    expect(listaAna.body.items[0].id).toBe(matAna.body.id);

    const cancelarAlheia = await request(app)
      .delete(`/matriculas/${matAna.body.id}`)
      .set("Authorization", `Bearer ${tokenBruno}`);

    expect(cancelarAlheia.status).toBe(404);
  });

  it("Requisito extra: bloqueia choque de horário e permite horários adjacentes", async () => {
    const turmaManha = await prisma.turma.create({
      data: {
        idDisciplina: discAId,
        idProfessor: profId,
        vagas: 10,
        status: StatusTurma.aberta,
        horarios: { create: [{ dia: 1, inicio: 480, fim: 600 }] }, // Seg 08:00-10:00
      },
    });
    const turmaConflito = await prisma.turma.create({
      data: {
        idDisciplina: discBId,
        idProfessor: profId,
        vagas: 10,
        status: StatusTurma.aberta,
        horarios: { create: [{ dia: 1, inicio: 540, fim: 660 }] }, // Seg 09:00-11:00
      },
    });
    const turmaAdjacente = await prisma.turma.create({
      data: {
        idDisciplina: discCId,
        idProfessor: profId,
        vagas: 10,
        status: StatusTurma.aberta,
        horarios: { create: [{ dia: 1, inicio: 600, fim: 720 }] }, // Seg 10:00-12:00
      },
    });

    const primeira = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaManha.id });
    expect(primeira.status).toBe(201);

    const conflito = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaConflito.id });
    expect(conflito.status).toBe(422);
    expect(conflito.body.code).toBe("CONFLITO_DE_HORARIO");

    const adjacente = await request(app)
      .post("/matriculas")
      .set("Authorization", `Bearer ${tokenAna}`)
      .send({ idTurma: turmaAdjacente.id });
    expect(adjacente.status).toBe(201);

    // Garante que brunoId continua válido no banco caso seja necessário
    expect(brunoId).toBeGreaterThan(0);
  });
});
