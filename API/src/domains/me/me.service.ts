import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../utils/errors.utils";
import { formatarSlotHorario, SlotHorario } from "../../utils/horario.utils";
import {
  calcularProgressoCurricularAluno,
  montarPerfilUsuario,
  PerfilUsuarioDTO,
  ProgressoCurricularDTO,
} from "../../utils/perfil.utils";

export interface HorarioFormatadoDTO extends SlotHorario {
  texto: string;
}

export interface MatriculaAlunoDTO {
  idMatricula: number;
  idTurma: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  classificacaoNoCurso: "obrigatoria" | "perfil" | "livre";
  professor: string;
  statusTurma: StatusTurma;
  statusMatricula: StatusMatricula;
  horarios: HorarioFormatadoDTO[];
}

export interface DashboardAlunoDTO {
  tipo: "aluno";
  progresso: ProgressoCurricularDTO;
  matriculasAtivas: MatriculaAlunoDTO[];
  historico: MatriculaAlunoDTO[];
}

export interface TurmaProfessorDTO {
  id: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  vagas: number;
  ocupadas: number;
  totalHistorico: number;
  status: StatusTurma;
  horarios: HorarioFormatadoDTO[];
}

export interface DashboardProfessorDTO {
  tipo: "professor";
  turmas: TurmaProfessorDTO[];
}

export interface CursoResumoSecretariaDTO {
  id: number;
  nome: string;
  chPerfil: number;
  chLivres: number;
  totalAlunos: number;
  totalDisciplinasVinculadas: number;
}

export interface TurmaAbertaSecretariaDTO {
  id: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  professor: string;
  vagas: number;
  ocupadas: number;
  horarios: HorarioFormatadoDTO[];
}

export interface DashboardServidorDTO {
  tipo: "servidor";
  metricas: {
    cursos: number;
    disciplinas: number;
    alunos: number;
    professores: number;
    professoresSemCadastro: number;
    turmasAbertas: number;
    turmasEncerradas: number;
  };
  cursos: CursoResumoSecretariaDTO[];
  turmasAbertas: TurmaAbertaSecretariaDTO[];
}

export type DashboardUsuarioDTO =
  | DashboardAlunoDTO
  | DashboardProfessorDTO
  | DashboardServidorDTO;

function formatarListaHorarios(
  horarios: Array<{ dia: number; inicio: number; fim: number }>,
): HorarioFormatadoDTO[] {
  return horarios.map((h) => ({
    dia: h.dia,
    inicio: h.inicio,
    fim: h.fim,
    texto: formatarSlotHorario({ dia: h.dia, inicio: h.inicio, fim: h.fim }),
  }));
}

/**
 * Carrega o perfil completo e os dados iniciais de dashboard específicos do usuário autenticado.
 */
export async function obterDashboardPorUsuario(idCadastro: number): Promise<{
  usuario: PerfilUsuarioDTO;
  dashboard: DashboardUsuarioDTO;
}> {
  const cadastro = await prisma.cadastro.findUnique({
    where: { id: idCadastro },
    include: {
      aluno: { include: { curso: true } },
      professor: true,
      servidor: true,
    },
  });

  if (!cadastro) {
    throw new AppError("Cadastro não encontrado.", 404);
  }

  const usuario = montarPerfilUsuario(cadastro);

  if (usuario.perfil === "aluno" && cadastro.aluno) {
    const [vinculosCurso, matriculas] = await Promise.all([
      prisma.disciplinaCurso.findMany({
        where: { idCurso: cadastro.aluno.idCurso },
        include: { disciplina: true },
      }),
      prisma.alunosTurma.findMany({
        where: { idAluno: cadastro.aluno.id },
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

    const mapaTipos = new Map<number, TipoDisciplina>();
    let chObrigatoriaExigida = 0;

    for (const vinculo of vinculosCurso) {
      mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
      if (vinculo.tipo === TipoDisciplina.obrigatoria) {
        chObrigatoriaExigida += vinculo.disciplina.cargaHoraria;
      }
    }

    const disciplinasAprovadas = matriculas
      .filter((m) => m.status === StatusMatricula.aprovado)
      .map((m) => ({
        idDisciplina: m.turma.idDisciplina,
        cargaHoraria: m.turma.disciplina.cargaHoraria,
      }));

    const progresso = calcularProgressoCurricularAluno(
      chObrigatoriaExigida,
      cadastro.aluno.curso.chPerfil,
      cadastro.aluno.curso.chLivres,
      disciplinasAprovadas,
      mapaTipos,
    );

    const mapearMatricula = (m: (typeof matriculas)[number]): MatriculaAlunoDTO => {
      const tipoCurso = mapaTipos.get(m.turma.idDisciplina);
      const classificacaoNoCurso: "obrigatoria" | "perfil" | "livre" =
        tipoCurso === TipoDisciplina.obrigatoria
          ? "obrigatoria"
          : tipoCurso === TipoDisciplina.perfil
            ? "perfil"
            : "livre";

      return {
        idMatricula: m.id,
        idTurma: m.idTurma,
        codigoDisciplina: m.turma.disciplina.codigo,
        nomeDisciplina: m.turma.disciplina.nome,
        cargaHoraria: m.turma.disciplina.cargaHoraria,
        classificacaoNoCurso,
        professor: m.turma.professor.nome,
        statusTurma: m.turma.status,
        statusMatricula: m.status,
        horarios: formatarListaHorarios(m.turma.horarios),
      };
    };

    const matriculasAtivas = matriculas
      .filter((m) => m.status === StatusMatricula.cursando)
      .map(mapearMatricula);

    const historico = matriculas
      .filter(
        (m) => m.status === StatusMatricula.aprovado || m.status === StatusMatricula.reprovado,
      )
      .map(mapearMatricula);

    return {
      usuario,
      dashboard: {
        tipo: "aluno",
        progresso,
        matriculasAtivas,
        historico,
      },
    };
  }

  if (usuario.perfil === "professor" && cadastro.professor) {
    const turmas = await prisma.turma.findMany({
      where: { idProfessor: cadastro.professor.id },
      include: {
        disciplina: true,
        horarios: { orderBy: [{ dia: "asc" }, { inicio: "asc" }] },
        matriculas: { select: { status: true } },
      },
      orderBy: [{ status: "asc" }, { id: "asc" }],
    });

    return {
      usuario,
      dashboard: {
        tipo: "professor",
        turmas: turmas.map((t) => ({
          id: t.id,
          codigoDisciplina: t.disciplina.codigo,
          nomeDisciplina: t.disciplina.nome,
          cargaHoraria: t.disciplina.cargaHoraria,
          vagas: t.vagas,
          ocupadas: t.matriculas.filter((m) => m.status === StatusMatricula.cursando).length,
          totalHistorico: t.matriculas.filter(
            (m) => m.status === StatusMatricula.aprovado || m.status === StatusMatricula.reprovado,
          ).length,
          status: t.status,
          horarios: formatarListaHorarios(t.horarios),
        })),
      },
    };
  }

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
    usuario,
    dashboard: {
      tipo: "servidor",
      metricas: {
        cursos: totalCursos,
        disciplinas: totalDisciplinas,
        alunos: totalAlunos,
        professores: totalProfessores,
        professoresSemCadastro: totalProfessoresSemCadastro,
        turmasAbertas: totalTurmasAbertas,
        turmasEncerradas: totalTurmasEncerradas,
      },
      cursos: cursos.map((c) => ({
        id: c.id,
        nome: c.nome,
        chPerfil: c.chPerfil,
        chLivres: c.chLivres,
        totalAlunos: c._count.alunos,
        totalDisciplinasVinculadas: c._count.disciplinas,
      })),
      turmasAbertas: turmasAbertas.map((t) => ({
        id: t.id,
        codigoDisciplina: t.disciplina.codigo,
        nomeDisciplina: t.disciplina.nome,
        cargaHoraria: t.disciplina.cargaHoraria,
        professor: t.professor.nome,
        vagas: t.vagas,
        ocupadas: t.matriculas.length,
        horarios: formatarListaHorarios(t.horarios),
      })),
    },
  };
}
