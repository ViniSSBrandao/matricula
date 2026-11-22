import { StatusMatricula, StatusTurma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { limparBancoDeTestes, loginComo } from "./helpers/test-fixtures";

describe("Regras de negócio — Cadastros da Secretaria (Regras 1 a 5)", () => {
  let tokenSecretaria: string;
  let tokenAluno: string;

  beforeEach(async () => {
    await limparBancoDeTestes();

    const servidor = await prisma.servidor.create({
      data: { nome: "Secretaria Teste" },
    });
    await prisma.cadastro.create({
      data: { login: "sec.teste", email: "sec@ufpe.br", idServidor: servidor.id },
    });

    const curso = await prisma.curso.create({
      data: { nome: "Ciência da Computação", chPerfil: 120, chLivres: 60 },
    });
    const aluno = await prisma.aluno.create({
      data: { nome: "Aluno Teste", idCurso: curso.id },
    });
    await prisma.cadastro.create({
      data: { login: "aluno.teste", email: "aluno@ufpe.br", idAluno: aluno.id },
    });

    tokenSecretaria = await loginComo("sec.teste");
    tokenAluno = await loginComo("aluno.teste");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("impede que perfil aluno acesse rotas de cadastro da secretaria", async () => {
    const res = await request(app)
      .post("/disciplinas")
      .set("Authorization", `Bearer ${tokenAluno}`)
      .send({ codigo: "IF999", nome: "Teste", cargaHoraria: 60 });

    expect(res.status).toBe(403);
  });

  it("Regra 1: rejeita código de disciplina duplicado no cadastro e na edição", async () => {
    const primeira = await request(app)
      .post("/disciplinas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ codigo: "IF668", nome: "Introdução à Computação", cargaHoraria: 60 });

    expect(primeira.status).toBe(201);

    const duplicada = await request(app)
      .post("/disciplinas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ codigo: "IF668", nome: "Outra Disciplina", cargaHoraria: 60 });

    expect(duplicada.status).toBe(409);
    expect(duplicada.body.code).toBe("DISCIPLINA_CODIGO_DUPLICADO");

    const segunda = await request(app)
      .post("/disciplinas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ codigo: "IF669", nome: "Algoritmos", cargaHoraria: 60 });

    expect(segunda.status).toBe(201);

    const edicaoDuplicada = await request(app)
      .put(`/disciplinas/${segunda.body.id}`)
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ codigo: "IF668", nome: "Algoritmos", cargaHoraria: 60 });

    expect(edicaoDuplicada.status).toBe(409);
    expect(edicaoDuplicada.body.code).toBe("DISCIPLINA_CODIGO_DUPLICADO");
  });

  it("Regra 2: aceita CH múltipla de 15 entre 15h e 120h e rejeita valores inválidos", async () => {
    for (const chInvalida of [0, 10, 20, 135]) {
      const res = await request(app)
        .post("/disciplinas")
        .set("Authorization", `Bearer ${tokenSecretaria}`)
        .send({ codigo: `INV${chInvalida}`, nome: "Inválida", cargaHoraria: chInvalida });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    }

    for (const chValida of [15, 60, 120]) {
      const res = await request(app)
        .post("/disciplinas")
        .set("Authorization", `Bearer ${tokenSecretaria}`)
        .send({ codigo: `VAL${chValida}`, nome: `Válida ${chValida}`, cargaHoraria: chValida });

      expect(res.status).toBe(201);
      expect(res.body.cargaHoraria).toBe(chValida);
    }
  });

  it("Regra 3: rejeita e-mail de professor duplicado", async () => {
    const primeiro = await request(app)
      .post("/professores")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ nome: "Prof. Ricardo", email: "ricardo@ufpe.br", titulacao: "Doutor" });

    expect(primeiro.status).toBe(201);

    const duplicado = await request(app)
      .post("/professores")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ nome: "Outro Professor", email: "ricardo@ufpe.br", titulacao: "Mestre" });

    expect(duplicado.status).toBe(409);
    expect(duplicado.body.code).toBe("PROFESSOR_EMAIL_DUPLICADO");
  });

  it("Regra 4: exige disciplina, professor existentes e pelo menos 1 vaga ao abrir turma", async () => {
    const disc = await prisma.disciplina.create({
      data: { codigo: "IF668", nome: "Introdução", cargaHoraria: 60 },
    });
    const prof = await prisma.professor.create({
      data: { nome: "Prof. Ricardo", email: "ricardo@ufpe.br", titulacao: "Doutor" },
    });

    const semVagas = await request(app)
      .post("/turmas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ idDisciplina: disc.id, idProfessor: prof.id, vagas: 0 });

    expect(semVagas.status).toBe(400);
    expect(semVagas.body.code).toBe("VALIDATION_ERROR");

    const discInexistente = await request(app)
      .post("/turmas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ idDisciplina: 9999, idProfessor: prof.id, vagas: 10 });

    expect(discInexistente.status).toBe(404);

    const valida = await request(app)
      .post("/turmas")
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ idDisciplina: disc.id, idProfessor: prof.id, vagas: 1 });

    expect(valida.status).toBe(201);
    expect(valida.body.vagas).toBe(1);
  });

  it("Regra 5: impede reduzir vagas abaixo dos matriculados e permite igualar ao total ocupado", async () => {
    const disc = await prisma.disciplina.create({
      data: { codigo: "IF668", nome: "Introdução", cargaHoraria: 60 },
    });
    const prof = await prisma.professor.create({
      data: { nome: "Prof. Ricardo", email: "ricardo@ufpe.br", titulacao: "Doutor" },
    });
    const turma = await prisma.turma.create({
      data: {
        idDisciplina: disc.id,
        idProfessor: prof.id,
        vagas: 5,
        status: StatusTurma.aberta,
      },
    });

    const curso = await prisma.curso.findFirstOrThrow();
    const aluno2 = await prisma.aluno.create({ data: { nome: "Aluno 2", idCurso: curso.id } });
    const aluno1 = await prisma.aluno.findFirstOrThrow({ where: { nome: "Aluno Teste" } });

    await prisma.alunosTurma.createMany({
      data: [
        { idTurma: turma.id, idAluno: aluno1.id, status: StatusMatricula.cursando },
        { idTurma: turma.id, idAluno: aluno2.id, status: StatusMatricula.cursando },
      ],
    });

    const abaixo = await request(app)
      .patch(`/turmas/${turma.id}/vagas`)
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ vagas: 1 });

    expect(abaixo.status).toBe(422);
    expect(abaixo.body.code).toBe("VAGAS_ABAIXO_DE_MATRICULADOS");

    const igual = await request(app)
      .patch(`/turmas/${turma.id}/vagas`)
      .set("Authorization", `Bearer ${tokenSecretaria}`)
      .send({ vagas: 2 });

    expect(igual.status).toBe(200);
    expect(igual.body.vagas).toBe(2);
    expect(igual.body.ocupadas).toBe(2);
    expect(igual.body.vagasDisponiveis).toBe(0);
  });
});
