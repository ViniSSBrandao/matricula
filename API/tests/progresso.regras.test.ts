import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { limparBancoDeTestes, loginComo } from "./helpers/test-fixtures";

describe("Regras de negócio — Progresso no Curso (Regras 10 a 13)", () => {
  let tokenAnaCC: string;
  let tokenCarlaEC: string;
  let anaId: number;
  let profId: number;
  let discCompartilhadaId: number;
  let discPerfil1Id: number;
  let discPerfil2Id: number;
  let discLivreId: number;

  beforeEach(async () => {
    await limparBancoDeTestes();

    const [cursoCC, cursoEC] = await Promise.all([
      prisma.curso.create({ data: { nome: "Ciência da Computação", chPerfil: 90, chLivres: 60 } }),
      prisma.curso.create({ data: { nome: "Engenharia da Computação", chPerfil: 60, chLivres: 60 } }),
    ]);

    const [ana, carla] = await Promise.all([
      prisma.aluno.create({ data: { nome: "Ana CC", idCurso: cursoCC.id } }),
      prisma.aluno.create({ data: { nome: "Carla EC", idCurso: cursoEC.id } }),
    ]);
    anaId = ana.id;

    await prisma.cadastro.createMany({
      data: [
        { login: "ana.cc", email: "ana.cc@ufpe.br", idAluno: ana.id },
        { login: "carla.ec", email: "carla.ec@ufpe.br", idAluno: carla.id },
      ],
    });

    const prof = await prisma.professor.create({
      data: { nome: "Prof. Ricardo", email: "ricardo@ufpe.br", titulacao: "Doutor" },
    });
    profId = prof.id;

    const [discComp, discP1, discP2, discLivre] = await Promise.all([
      prisma.disciplina.create({ data: { codigo: "IF668", nome: "Compartilhada", cargaHoraria: 60 } }),
      prisma.disciplina.create({ data: { codigo: "IF672", nome: "Perfil 1", cargaHoraria: 60 } }),
      prisma.disciplina.create({ data: { codigo: "IF673", nome: "Perfil 2", cargaHoraria: 60 } }),
      prisma.disciplina.create({ data: { codigo: "AD801", nome: "Livre", cargaHoraria: 60 } }),
    ]);

    discCompartilhadaId = discComp.id;
    discPerfil1Id = discP1.id;
    discPerfil2Id = discP2.id;
    discLivreId = discLivre.id;

    // Mesma disciplina IF668 é obrigatória em CC e perfil em EC
    await prisma.disciplinaCurso.createMany({
      data: [
        { idCurso: cursoCC.id, idDisciplina: discComp.id, tipo: TipoDisciplina.obrigatoria },
        { idCurso: cursoEC.id, idDisciplina: discComp.id, tipo: TipoDisciplina.perfil },
        { idCurso: cursoCC.id, idDisciplina: discP1.id, tipo: TipoDisciplina.perfil },
        { idCurso: cursoCC.id, idDisciplina: discP2.id, tipo: TipoDisciplina.perfil },
      ],
    });

    tokenAnaCC = await loginComo("ana.cc");
    tokenCarlaEC = await loginComo("carla.ec");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Regra 10: classifica a mesma disciplina de acordo com o curso do aluno (e fora da estrutura como livre)", async () => {
    await Promise.all([
      prisma.turma.create({
        data: { idDisciplina: discCompartilhadaId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
      }),
      prisma.turma.create({
        data: { idDisciplina: discLivreId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta },
      }),
    ]);

    const ofertasAna = await request(app)
      .get("/ofertas")
      .set("Authorization", `Bearer ${tokenAnaCC}`);
    const ofertasCarla = await request(app)
      .get("/ofertas")
      .set("Authorization", `Bearer ${tokenCarlaEC}`);

    expect(ofertasAna.status).toBe(200);
    expect(ofertasCarla.status).toBe(200);

    const compAna = ofertasAna.body.items.find((i: { disciplina: { id: number } }) => i.disciplina.id === discCompartilhadaId);
    const compCarla = ofertasCarla.body.items.find((i: { disciplina: { id: number } }) => i.disciplina.id === discCompartilhadaId);
    const livreAna = ofertasAna.body.items.find((i: { disciplina: { id: number } }) => i.disciplina.id === discLivreId);

    expect(compAna.classificacao).toBe("obrigatoria");
    expect(compCarla.classificacao).toBe("perfil");
    expect(livreAna.classificacao).toBe("livre");
  });

  it("Regras 11, 12 e 13: transborda excedente de perfil para livres, separa emCurso, ignora reprovações e limita percentual a 100%", async () => {
    const [turmaP1, turmaP2, turmaLivre, turmaCompReprovada, turmaCompAtual] = await Promise.all([
      prisma.turma.create({ data: { idDisciplina: discPerfil1Id, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada } }),
      prisma.turma.create({ data: { idDisciplina: discPerfil2Id, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada } }),
      prisma.turma.create({ data: { idDisciplina: discLivreId, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada } }),
      prisma.turma.create({ data: { idDisciplina: discCompartilhadaId, idProfessor: profId, vagas: 10, status: StatusTurma.encerrada } }),
      prisma.turma.create({ data: { idDisciplina: discCompartilhadaId, idProfessor: profId, vagas: 10, status: StatusTurma.aberta } }),
    ]);

    // Ana tem:
    // - 120h de perfil aprovadas (60h + 60h), sendo chPerfil = 90h -> 90h em perfil e 30h de excedente para livres
    // - 60h de livre aprovada -> total livres integralizada = 60h + 30h = 90h (exigida = 60h)
    // - 60h obrigatória reprovada -> NÃO conta
    // - 60h obrigatória cursando -> conta apenas em emCurso
    await prisma.alunosTurma.createMany({
      data: [
        { idTurma: turmaP1.id, idAluno: anaId, status: StatusMatricula.aprovado },
        { idTurma: turmaP2.id, idAluno: anaId, status: StatusMatricula.aprovado },
        { idTurma: turmaLivre.id, idAluno: anaId, status: StatusMatricula.aprovado },
        { idTurma: turmaCompReprovada.id, idAluno: anaId, status: StatusMatricula.reprovado },
        { idTurma: turmaCompAtual.id, idAluno: anaId, status: StatusMatricula.cursando },
      ],
    });

    const res = await request(app)
      .get("/progresso")
      .set("Authorization", `Bearer ${tokenAnaCC}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      obrigatorias: {
        exigida: 60,
        integralizada: 0,
        emCurso: 60,
        falta: 60,
        percentual: 0,
      },
      perfil: {
        exigida: 90,
        integralizada: 90,
        emCurso: 0,
        falta: 0,
        percentual: 100,
      },
      livres: {
        exigida: 60,
        integralizada: 90,
        emCurso: 0,
        falta: 0,
        percentual: 100,
      },
    });
  });
});
