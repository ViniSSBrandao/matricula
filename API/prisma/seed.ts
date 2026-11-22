import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { criarSlotHorario } from "../src/utils/horario.utils";
import { assertAmbienteNaoProducao, limparBancoDeDados } from "./utils/db.utils";
import {
  calcularChObrigatoriaCurso,
  calcularResumoHistoricoAluno,
  criarTurmaComHorarios,
  imprimirResumoSeed,
  mapearDisciplinasPorCodigo,
  registrarMatriculas,
} from "./utils/seed.utils";

async function main(): Promise<void> {
  assertAmbienteNaoProducao();
  await limparBancoDeDados(prisma);

  // 1. Cursos
  const cursoCC = await prisma.curso.create({
    data: {
      nome: "Ciência da Computação",
      chPerfil: 120,
      chLivres: 60,
    },
  });

  const cursoEC = await prisma.curso.create({
    data: {
      nome: "Engenharia da Computação",
      chPerfil: 90,
      chLivres: 60,
    },
  });

  // 2. Disciplinas (15 disciplinas com CH múltipla de 15 entre 15 e 120)
  const dadosDisciplinas = [
    // Compartilhadas com classificação DIFERENTE
    { codigo: "IF668", nome: "Introdução à Programação", cargaHoraria: 60 },
    { codigo: "IF670", nome: "Sistemas Digitais", cargaHoraria: 60 },
    // Compartilhadas com a MESMA classificação
    { codigo: "IF669", nome: "Algoritmos e Estruturas de Dados", cargaHoraria: 60 },
    { codigo: "IF671", nome: "Inteligência Artificial", cargaHoraria: 60 },
    // Exclusivas de Ciência da Computação (livres para EC)
    { codigo: "IF672", nome: "Banco de Dados", cargaHoraria: 60 },
    { codigo: "IF673", nome: "Engenharia de Software", cargaHoraria: 60 },
    { codigo: "IF674", nome: "Compiladores", cargaHoraria: 60 },
    { codigo: "IF675", nome: "Computação Gráfica", cargaHoraria: 45 },
    { codigo: "IF676", nome: "Aprendizado de Máquina", cargaHoraria: 45 },
    // Exclusivas de Engenharia da Computação (livres para CC)
    { codigo: "EC701", nome: "Circuitos Elétricos", cargaHoraria: 60 },
    { codigo: "EC702", nome: "Sistemas Embarcados", cargaHoraria: 60 },
    { codigo: "EC703", nome: "Robótica Móvel", cargaHoraria: 45 },
    { codigo: "EC704", nome: "Automação Industrial", cargaHoraria: 45 },
    // Fora da estrutura dos dois cursos (livres universais)
    { codigo: "AD801", nome: "Empreendedorismo e Inovação", cargaHoraria: 30 },
    { codigo: "LE901", nome: "Libras", cargaHoraria: 30 },
  ];

  await prisma.disciplina.createMany({ data: dadosDisciplinas });
  const todasDisciplinas = await prisma.disciplina.findMany({ orderBy: { id: "asc" } });
  const disc = mapearDisciplinasPorCodigo(todasDisciplinas);

  // 3. Vínculos disciplina_curso
  await prisma.disciplinaCurso.createMany({
    data: [
      // Ciência da Computação
      { idCurso: cursoCC.id, idDisciplina: disc.IF668.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoCC.id, idDisciplina: disc.IF670.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoCC.id, idDisciplina: disc.IF669.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoCC.id, idDisciplina: disc.IF671.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoCC.id, idDisciplina: disc.IF672.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoCC.id, idDisciplina: disc.IF673.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoCC.id, idDisciplina: disc.IF674.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoCC.id, idDisciplina: disc.IF675.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoCC.id, idDisciplina: disc.IF676.id, tipo: TipoDisciplina.perfil },

      // Engenharia da Computação
      { idCurso: cursoEC.id, idDisciplina: disc.IF668.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoEC.id, idDisciplina: disc.IF670.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoEC.id, idDisciplina: disc.IF669.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoEC.id, idDisciplina: disc.IF671.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoEC.id, idDisciplina: disc.EC701.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoEC.id, idDisciplina: disc.EC702.id, tipo: TipoDisciplina.obrigatoria },
      { idCurso: cursoEC.id, idDisciplina: disc.EC703.id, tipo: TipoDisciplina.perfil },
      { idCurso: cursoEC.id, idDisciplina: disc.EC704.id, tipo: TipoDisciplina.perfil },
    ],
  });

  // 4. Servidor (1 com cadastro), Professores (1 com cadastro, 2 sem cadastro) e Alunos (4 com cadastro)
  const servidorSecretaria = await prisma.servidor.create({
    data: { nome: "Marcos Ribeiro" },
  });

  await prisma.cadastro.create({
    data: {
      login: "secretaria",
      email: "secretaria@ufpe.br",
      idServidor: servidorSecretaria.id,
    },
  });

  const profRicardo = await prisma.professor.create({
    data: {
      nome: "Prof. Ricardo Almeida",
      titulacao: "Doutor",
      email: "ricardo.almeida@ufpe.br",
    },
  });

  await prisma.cadastro.create({
    data: {
      login: "ricardo.prof",
      email: "ricardo.almeida@ufpe.br",
      idProfessor: profRicardo.id,
    },
  });

  // Professores sem cadastro (exercita perfil sem acesso ao sistema)
  const profHelena = await prisma.professor.create({
    data: {
      nome: "Profa. Helena Costa",
      titulacao: "Doutora",
      email: "helena.costa@ufpe.br",
    },
  });

  const profFernando = await prisma.professor.create({
    data: {
      nome: "Prof. Fernando Santos",
      titulacao: "Mestre",
      email: "fernando.santos@ufpe.br",
    },
  });

  const ana = await prisma.aluno.create({
    data: { nome: "Ana Beatriz Souza", idCurso: cursoCC.id },
  });
  const bruno = await prisma.aluno.create({
    data: { nome: "Bruno Oliveira", idCurso: cursoCC.id },
  });
  const carla = await prisma.aluno.create({
    data: { nome: "Carla Mendes", idCurso: cursoEC.id },
  });
  const diego = await prisma.aluno.create({
    data: { nome: "Diego Ferreira", idCurso: cursoEC.id },
  });

  await prisma.cadastro.createMany({
    data: [
      { login: "ana.cc", email: "ana.cc@ufpe.br", idAluno: ana.id },
      { login: "bruno.cc", email: "bruno.cc@ufpe.br", idAluno: bruno.id },
      { login: "carla.ec", email: "carla.ec@ufpe.br", idAluno: carla.id },
      { login: "diego.ec", email: "diego.ec@ufpe.br", idAluno: diego.id },
    ],
  });

  // 5. Histórico: turmas encerradas (sem horário obrigatório) e matrículas aprovado/reprovado
  const encIF668 = await criarTurmaComHorarios(prisma, {
    idProfessor: profRicardo.id,
    idDisciplina: disc.IF668.id,
    vagas: 40,
    status: StatusTurma.encerrada,
  });
  const encIF669 = await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.IF669.id,
    vagas: 40,
    status: StatusTurma.encerrada,
  });
  const encIF670 = await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.IF670.id,
    vagas: 40,
    status: StatusTurma.encerrada,
  });
  const encIF671 = await criarTurmaComHorarios(prisma, {
    idProfessor: profRicardo.id,
    idDisciplina: disc.IF671.id,
    vagas: 35,
    status: StatusTurma.encerrada,
  });
  // Disciplina Y (IF672): ana.cc aprovada aqui, e há turma aberta de IF672 hoje
  const encIF672 = await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.IF672.id,
    vagas: 35,
    status: StatusTurma.encerrada,
  });
  // Disciplina X (IF673): bruno.cc reprovado aqui, e há turma aberta de IF673 hoje (pode recursar)
  const encIF673 = await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.IF673.id,
    vagas: 35,
    status: StatusTurma.encerrada,
  });
  const encIF675 = await criarTurmaComHorarios(prisma, {
    idProfessor: profRicardo.id,
    idDisciplina: disc.IF675.id,
    vagas: 30,
    status: StatusTurma.encerrada,
  });
  // Exclusiva de EC: livre para ana.cc (CC) e obrigatória para carla.ec (EC)
  const encEC701 = await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.EC701.id,
    vagas: 35,
    status: StatusTurma.encerrada,
  });
  const encEC702 = await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.EC702.id,
    vagas: 30,
    status: StatusTurma.encerrada,
  });
  // Livre universal
  const encAD801 = await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.AD801.id,
    vagas: 50,
    status: StatusTurma.encerrada,
  });

  await registrarMatriculas(prisma, [
    // ana.cc (CC): aprovações nos 3 grupos + perfil excedente (165h > 120h) + livre universal + exclusiva de EC + disciplina Y (IF672)
    { idTurma: encIF668.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encIF669.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encIF672.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encIF670.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encIF671.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encIF675.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encEC701.id, idAluno: ana.id, status: StatusMatricula.aprovado },
    { idTurma: encAD801.id, idAluno: ana.id, status: StatusMatricula.aprovado },

    // bruno.cc (CC): poucas aprovações + reprovado em X (IF673) que tem turma aberta hoje
    { idTurma: encIF668.id, idAluno: bruno.id, status: StatusMatricula.aprovado },
    { idTurma: encIF673.id, idAluno: bruno.id, status: StatusMatricula.reprovado },

    // carla.ec (EC): perfil excedente em EC (120h > 90h) + obrigatórias de EC
    { idTurma: encIF670.id, idAluno: carla.id, status: StatusMatricula.aprovado },
    { idTurma: encEC701.id, idAluno: carla.id, status: StatusMatricula.aprovado },
    { idTurma: encIF668.id, idAluno: carla.id, status: StatusMatricula.aprovado },
    { idTurma: encIF671.id, idAluno: carla.id, status: StatusMatricula.aprovado },

    // diego.ec (EC): poucas aprovações + reprovação em EC702 (tem turma aberta hoje)
    { idTurma: encIF670.id, idAluno: diego.id, status: StatusMatricula.aprovado },
    { idTurma: encEC702.id, idAluno: diego.id, status: StatusMatricula.reprovado },
  ]);

  // 6. Turmas abertas (8 turmas) com horarios_turma
  // Turma 1: IF672 (Y já aprovada por ana.cc) - Seg e Qua 08:00-10:00
  await criarTurmaComHorarios(prisma, {
    idProfessor: profRicardo.id,
    idDisciplina: disc.IF672.id,
    vagas: 30,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(1, "08:00", "10:00"), criarSlotHorario(3, "08:00", "10:00")],
  });

  // Turma 2: IF673 (X reprovada por bruno.cc) - Ter e Qui 10:00-12:00
  await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.IF673.id,
    vagas: 30,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(2, "10:00", "12:00"), criarSlotHorario(4, "10:00", "12:00")],
  });

  // Turma 3: IF674 - LOTADA (vagas = 1, ocupada por ana.cc cursando) - Ter e Qui 14:00-16:00
  const abertaIF674Lotada = await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.IF674.id,
    vagas: 1,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(2, "14:00", "16:00"), criarSlotHorario(4, "14:00", "16:00")],
  });

  // Turma 4: IF676 - CHOCA com Turma 5 (Seg/Qua 14:00-16:00) - ocupada por bruno.cc cursando
  const abertaIF676ChoqueA = await criarTurmaComHorarios(prisma, {
    idProfessor: profRicardo.id,
    idDisciplina: disc.IF676.id,
    vagas: 25,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(1, "14:00", "16:00"), criarSlotHorario(3, "14:00", "16:00")],
  });

  // Turma 5: EC703 - CHOCA com Turma 4 (Seg/Qua 15:00-17:00)
  await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.EC703.id,
    vagas: 25,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(1, "15:00", "17:00"), criarSlotHorario(3, "15:00", "17:00")],
  });

  // Turma 6: AD801 - ADJACENTE à Turma 4 (Seg 16:00-18:00: fim da Turma 4 = início desta, NÃO choca)
  await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.AD801.id,
    vagas: 40,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(1, "16:00", "18:00")],
  });

  // Turma 7: EC702 - Ter e Qui 08:00-10:00 (carla.ec cursando)
  const abertaEC702 = await criarTurmaComHorarios(prisma, {
    idProfessor: profHelena.id,
    idDisciplina: disc.EC702.id,
    vagas: 20,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(2, "08:00", "10:00"), criarSlotHorario(4, "08:00", "10:00")],
  });

  // Turma 8: LE901 - Sex 08:00-10:00
  await criarTurmaComHorarios(prisma, {
    idProfessor: profFernando.id,
    idDisciplina: disc.LE901.id,
    vagas: 35,
    status: StatusTurma.aberta,
    horarios: [criarSlotHorario(5, "08:00", "10:00")],
  });

  // 7. Matrículas ativas (cursando) em turmas abertas
  await registrarMatriculas(prisma, [
    { idTurma: abertaIF674Lotada.id, idAluno: ana.id, status: StatusMatricula.cursando },
    { idTurma: abertaIF676ChoqueA.id, idAluno: bruno.id, status: StatusMatricula.cursando },
    { idTurma: abertaEC702.id, idAluno: carla.id, status: StatusMatricula.cursando },
  ]);

  // Verificação resumida dos cálculos curriculares para exibição no log do seed
  const vinculosCC = await prisma.disciplinaCurso.findMany({
    where: { idCurso: cursoCC.id },
    include: { disciplina: true },
  });
  const vinculosEC = await prisma.disciplinaCurso.findMany({
    where: { idCurso: cursoEC.id },
    include: { disciplina: true },
  });

  const chObrigCC = calcularChObrigatoriaCurso(vinculosCC);
  const chObrigEC = calcularChObrigatoriaCurso(vinculosEC);
  const resumoAna = calcularResumoHistoricoAluno(cursoCC.chPerfil, [
    { cargaHoraria: disc.IF668.cargaHoraria, tipoNoCurso: TipoDisciplina.obrigatoria },
    { cargaHoraria: disc.IF669.cargaHoraria, tipoNoCurso: TipoDisciplina.obrigatoria },
    { cargaHoraria: disc.IF672.cargaHoraria, tipoNoCurso: TipoDisciplina.obrigatoria },
    { cargaHoraria: disc.IF670.cargaHoraria, tipoNoCurso: TipoDisciplina.perfil },
    { cargaHoraria: disc.IF671.cargaHoraria, tipoNoCurso: TipoDisciplina.perfil },
    { cargaHoraria: disc.IF675.cargaHoraria, tipoNoCurso: TipoDisciplina.perfil },
    { cargaHoraria: disc.EC701.cargaHoraria, tipoNoCurso: null },
    { cargaHoraria: disc.AD801.cargaHoraria, tipoNoCurso: null },
  ]);

  console.log("Seed concluído com sucesso.");
  console.log(`- CH obrigatória CC: ${chObrigCC}h | CH obrigatória EC: ${chObrigEC}h`);
  console.log(
    `- Resumo ana.cc: Obrigatória=${resumoAna.chObrigatoriaAprovada}h, Perfil=${resumoAna.chPerfilBrutaAprovada}h (aproveitada=${resumoAna.chPerfilAproveitada}h, excedente->livre=${resumoAna.chExcedentePerfilParaLivre}h), LivresTotal=${resumoAna.chLivresTotal}h`,
  );

  await imprimirResumoSeed(prisma);
}

main()
  .catch((erro: unknown) => {
    console.error("Erro ao executar seed:", erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
