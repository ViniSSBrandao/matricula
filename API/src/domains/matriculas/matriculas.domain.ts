import {
  ClassificacaoDisciplina,
  classificarDisciplina,
  TipoVinculoDisciplina,
} from "../progresso/progresso.domain";

export interface MatriculaGradeInput {
  idMatricula: number;
  idTurma: number;
  idDisciplina: number;
  disciplina: {
    codigo: string;
    nome: string;
  };
  professor: {
    nome: string;
  };
  horarios: Array<{
    dia: number;
    inicio: number;
    fim: number;
  }>;
}

export interface BlocoGradeDTO {
  idMatricula: number;
  idTurma: number;
  dia: number;
  inicio: number;
  fim: number;
  disciplina: {
    codigo: string;
    nome: string;
  };
  professor: {
    nome: string;
  };
  classificacao: ClassificacaoDisciplina;
}

export interface SemHorarioGradeDTO {
  idMatricula: number;
  idTurma: number;
  disciplina: {
    codigo: string;
    nome: string;
  };
  professor: {
    nome: string;
  };
  classificacao: ClassificacaoDisciplina;
}

export interface GradeSemanalDTO {
  blocos: BlocoGradeDTO[];
  semHorario: SemHorarioGradeDTO[];
}

/**
 * Monta os blocos semanais ordenados por dia e início e separa turmas sem horário cadastrado.
 */
export function montarGrade(
  matriculas: MatriculaGradeInput[],
  mapaTipos: Map<number, TipoVinculoDisciplina>,
): GradeSemanalDTO {
  const blocos: BlocoGradeDTO[] = [];
  const semHorario: SemHorarioGradeDTO[] = [];

  for (const matricula of matriculas) {
    const classificacao = classificarDisciplina(mapaTipos.get(matricula.idDisciplina) ?? null);

    if (matricula.horarios.length === 0) {
      semHorario.push({
        idMatricula: matricula.idMatricula,
        idTurma: matricula.idTurma,
        disciplina: {
          codigo: matricula.disciplina.codigo,
          nome: matricula.disciplina.nome,
        },
        professor: {
          nome: matricula.professor.nome,
        },
        classificacao,
      });
      continue;
    }

    for (const horario of matricula.horarios) {
      blocos.push({
        idMatricula: matricula.idMatricula,
        idTurma: matricula.idTurma,
        dia: horario.dia,
        inicio: horario.inicio,
        fim: horario.fim,
        disciplina: {
          codigo: matricula.disciplina.codigo,
          nome: matricula.disciplina.nome,
        },
        professor: {
          nome: matricula.professor.nome,
        },
        classificacao,
      });
    }
  }

  blocos.sort((a, b) => a.dia - b.dia || a.inicio - b.inicio);

  return {
    blocos,
    semHorario,
  };
}
