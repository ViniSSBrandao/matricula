export type ClassificacaoDisciplina = "obrigatoria" | "perfil" | "livre";

export interface HorarioApi {
  dia: number;
  inicio: number;
  fim: number;
  texto: string;
}

export interface DisciplinaResumo {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

export interface ProfessorResumo {
  id: number;
  nome: string;
  titulacao: string;
}

export interface OfertaItem {
  id: number;
  vagas: number;
  ocupadas: number;
  vagasDisponiveis: number;
  classificacao: ClassificacaoDisciplina;
  disciplina: DisciplinaResumo;
  professor: ProfessorResumo;
  horarios: HorarioApi[];
  jaMatriculado: boolean;
  jaAprovado: boolean;
  conflitaComHorario: boolean;
}

export interface RespostaPaginada<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MatriculaItem {
  id: number;
  idTurma: number;
  status: "cursando" | "aprovado" | "reprovado" | "cancelada";
  classificacao: ClassificacaoDisciplina;
  disciplina: DisciplinaResumo;
  professor: ProfessorResumo;
  horarios: HorarioApi[];
}

export interface RespostaMatriculas {
  items: MatriculaItem[];
}

export interface GrupoProgresso {
  exigida: number;
  integralizada: number;
  emCurso: number;
  falta: number;
  percentual: number;
}

export interface RespostaProgresso {
  obrigatorias: GrupoProgresso;
  perfil: GrupoProgresso;
  livres: GrupoProgresso;
}

export interface BlocoGrade {
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

export interface SemHorarioGrade {
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

export interface RespostaGradeSemanal {
  blocos: BlocoGrade[];
  semHorario: SemHorarioGrade[];
}
