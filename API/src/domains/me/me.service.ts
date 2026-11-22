import { StatusMatricula, StatusTurma, TipoDisciplina } from "@prisma/client";
import { NotFoundError } from "../../utils/errors.utils";
import { formatarSlotHorario, SlotHorario } from "../../utils/horario.utils";
import {
  calcularProgressoCurricularAluno,
  montarPerfilUsuario,
  PerfilUsuarioDTO,
  ProgressoCurricularDTO,
} from "../../utils/perfil.utils";
import {
  buscarCadastroPorId,
  buscarDadosAcademicosAluno,
  buscarDadosConsolidadosSecretaria,
  buscarTurmasDoProfessor,
} from "./me.repository";

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
 * Carrega o perfil completo e o dashboard inicial específico do usuário autenticado.
 */
export async function obterDashboardPorUsuario(idCadastro: number): Promise<{
  usuario: PerfilUsuarioDTO;
  dashboard: DashboardUsuarioDTO;
}> {
  const cadastro = await buscarCadastroPorId(idCadastro);
  if (!cadastro) {
    throw new NotFoundError("Cadastro não encontrado.");
  }

  const usuario = montarPerfilUsuario(cadastro);

  if (usuario.perfil === "aluno" && cadastro.aluno) {
    const { vinculosCurso, matriculas } = await buscarDadosAcademicosAluno(
      cadastro.aluno.id,
      cadastro.aluno.idCurso,
    );

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

    return {
      usuario,
      dashboard: {
        tipo: "aluno",
        progresso,
        matriculasAtivas: matriculas
          .filter((m) => m.status === StatusMatricula.cursando)
          .map(mapearMatricula),
        historico: matriculas
          .filter(
            (m) => m.status === StatusMatricula.aprovado || m.status === StatusMatricula.reprovado,
          )
          .map(mapearMatricula),
      },
    };
  }

  if (usuario.perfil === "professor" && cadastro.professor) {
    const turmas = await buscarTurmasDoProfessor(cadastro.professor.id);

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

  const dadosSecretaria = await buscarDadosConsolidadosSecretaria();

  return {
    usuario,
    dashboard: {
      tipo: "servidor",
      metricas: dadosSecretaria.metricas,
      cursos: dadosSecretaria.cursos.map((c) => ({
        id: c.id,
        nome: c.nome,
        chPerfil: c.chPerfil,
        chLivres: c.chLivres,
        totalAlunos: c._count.alunos,
        totalDisciplinasVinculadas: c._count.disciplinas,
      })),
      turmasAbertas: dadosSecretaria.turmasAbertas.map((t) => ({
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
