import {
  Disciplina,
  PrismaClient,
  StatusMatricula,
  StatusTurma,
  TipoDisciplina,
} from "@prisma/client";
import { ContagemTabelas, coletarContagemTabelas } from "./db.utils";
import { SlotHorario } from "../../src/utils/horario.utils";

export interface DefinicaoTurmaInput {
  idProfessor: number;
  idDisciplina: number;
  vagas: number;
  status: StatusTurma;
  horarios?: SlotHorario[];
}

export interface LoginResumoRow {
  login: string;
  perfil: "aluno" | "professor" | "servidor";
  nome: string;
  detalhe: string;
  email: string;
}

export interface ResumoCargaHorariaAluno {
  chObrigatoriaAprovada: number;
  chPerfilBrutaAprovada: number;
  chPerfilAproveitada: number;
  chExcedentePerfilParaLivre: number;
  chLivresDiretasAprovada: number;
  chLivresTotal: number;
}

/**
 * Indexa uma lista de disciplinas pelo código (ex.: "IF668") para busca O(1).
 */
export function mapearDisciplinasPorCodigo(disciplinas: Disciplina[]): Record<string, Disciplina> {
  return disciplinas.reduce<Record<string, Disciplina>>((acc, disciplina) => {
    acc[disciplina.codigo] = disciplina;
    return acc;
  }, {});
}

/**
 * Soma a carga horária obrigatória total definida na matriz de um curso.
 */
export function calcularChObrigatoriaCurso(
  vinculos: Array<{ tipo: TipoDisciplina; disciplina: { cargaHoraria: number } }>,
): number {
  return vinculos
    .filter((vinculo) => vinculo.tipo === TipoDisciplina.obrigatoria)
    .reduce((total, vinculo) => total + vinculo.disciplina.cargaHoraria, 0);
}

/**
 * Calcula a distribuição de carga horária aprovada de um aluno, incluindo o transbordo
 * do excedente de disciplinas de perfil para eletivas livres.
 */
export function calcularResumoHistoricoAluno(
  chPerfilExigidaCurso: number,
  disciplinasAprovadas: Array<{ cargaHoraria: number; tipoNoCurso: TipoDisciplina | null }>,
): ResumoCargaHorariaAluno {
  let chObrigatoriaAprovada = 0;
  let chPerfilBrutaAprovada = 0;
  let chLivresDiretasAprovada = 0;

  for (const item of disciplinasAprovadas) {
    if (item.tipoNoCurso === TipoDisciplina.obrigatoria) {
      chObrigatoriaAprovada += item.cargaHoraria;
    } else if (item.tipoNoCurso === TipoDisciplina.perfil) {
      chPerfilBrutaAprovada += item.cargaHoraria;
    } else {
      chLivresDiretasAprovada += item.cargaHoraria;
    }
  }

  const chPerfilAproveitada = Math.min(chPerfilBrutaAprovada, chPerfilExigidaCurso);
  const chExcedentePerfilParaLivre = Math.max(0, chPerfilBrutaAprovada - chPerfilExigidaCurso);
  const chLivresTotal = chLivresDiretasAprovada + chExcedentePerfilParaLivre;

  return {
    chObrigatoriaAprovada,
    chPerfilBrutaAprovada,
    chPerfilAproveitada,
    chExcedentePerfilParaLivre,
    chLivresDiretasAprovada,
    chLivresTotal,
  };
}

/**
 * Cria uma turma e, caso informados, seus respectivos horários na mesma operação.
 */
export async function criarTurmaComHorarios(
  prisma: PrismaClient,
  input: DefinicaoTurmaInput,
) {
  return prisma.turma.create({
    data: {
      idProfessor: input.idProfessor,
      idDisciplina: input.idDisciplina,
      vagas: input.vagas,
      status: input.status,
      ...(input.horarios && input.horarios.length > 0
        ? {
            horarios: {
              create: input.horarios.map((slot) => ({
                dia: slot.dia,
                inicio: slot.inicio,
                fim: slot.fim,
              })),
            },
          }
        : {}),
    },
    include: {
      horarios: true,
      disciplina: true,
    },
  });
}

/**
 * Cria matrículas em lote para um aluno ou turma preservando tipagem estrita.
 */
export async function registrarMatriculas(
  prisma: PrismaClient,
  matriculas: Array<{ idTurma: number; idAluno: number; status: StatusMatricula }>,
): Promise<void> {
  await prisma.alunosTurma.createMany({
    data: matriculas,
  });
}

/**
 * Formata uma tabela textual alinhada para exibir os logins criados pelo seed.
 */
export function formatarTabelaLogins(linhas: LoginResumoRow[]): string {
  const cabecalho = ["LOGIN", "PERFIL", "NOME", "DETALHE", "EMAIL"];
  const matriz = [
    cabecalho,
    ...linhas.map((linha) => [linha.login, linha.perfil, linha.nome, linha.detalhe, linha.email]),
  ];

  const larguras = cabecalho.map((_, colIdx) =>
    Math.max(...matriz.map((row) => row[colIdx].length)),
  );

  const formatarLinha = (row: string[]) =>
    row.map((celula, idx) => celula.padEnd(larguras[idx])).join(" | ");

  const separador = larguras.map((largura) => "-".repeat(largura)).join("-+-");
  const corpo = matriz.slice(1).map(formatarLinha);

  return [formatarLinha(cabecalho), separador, ...corpo].join("\n");
}

/**
 * Formata o resumo de contagem de registros por tabela.
 */
export function formatarContagemTabelas(contagem: ContagemTabelas): string {
  const pares: Array<[string, number]> = [
    ["cursos", contagem.cursos],
    ["disciplinas", contagem.disciplinas],
    ["disciplina_curso", contagem.disciplinaCurso],
    ["professor", contagem.professor],
    ["servidor", contagem.servidor],
    ["aluno", contagem.aluno],
    ["cadastro", contagem.cadastro],
    ["turma", contagem.turma],
    ["alunos_turma", contagem.alunosTurma],
    ["horarios_turma", contagem.horariosTurma],
  ];

  return pares.map(([tabela, total]) => `- ${tabela.padEnd(18)}: ${total}`).join("\n");
}

/**
 * Coleta os dados persistidos após o seed e imprime logins e contagem por tabela no stdout.
 */
export async function imprimirResumoSeed(prisma: PrismaClient): Promise<void> {
  const [cadastros, contagem] = await Promise.all([
    prisma.cadastro.findMany({
      include: {
        aluno: { include: { curso: true } },
        professor: true,
        servidor: true,
      },
      orderBy: { id: "asc" },
    }),
    coletarContagemTabelas(prisma),
  ]);

  const linhas: LoginResumoRow[] = cadastros.map((cad) => {
    if (cad.aluno) {
      return {
        login: cad.login,
        perfil: "aluno",
        nome: cad.aluno.nome,
        detalhe: cad.aluno.curso.nome,
        email: cad.email,
      };
    }
    if (cad.professor) {
      return {
        login: cad.login,
        perfil: "professor",
        nome: cad.professor.nome,
        detalhe: cad.professor.titulacao,
        email: cad.email,
      };
    }
    if (cad.servidor) {
      return {
        login: cad.login,
        perfil: "servidor",
        nome: cad.servidor.nome,
        detalhe: "Secretaria Acadêmica",
        email: cad.email,
      };
    }
    throw new Error(`Cadastro inconsistente sem perfil associado: id=${cad.id}`);
  });

  console.log("\n=== LOGINS DISPONÍVEIS NO SEED ===");
  console.log(formatarTabelaLogins(linhas));
  console.log("\n=== CONTAGEM POR TABELA ===");
  console.log(formatarContagemTabelas(contagem));
  console.log("");
}
