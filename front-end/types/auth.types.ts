export type PerfilTipo = "aluno" | "professor" | "servidor";

export interface CursoResumo {
  id: number;
  nome: string;
  chPerfil: number;
  chLivres: number;
}

export interface UsuarioAutenticado {
  idCadastro: number;
  login: string;
  email: string;
  perfil: PerfilTipo;
  nome: string;
  idPerfil: number;
  curso?: CursoResumo;
  titulacao?: string;
}

export interface LoginDisponivelSeed {
  login: string;
  perfil: PerfilTipo;
  nome: string;
  detalhe: string;
  email: string;
}

export interface HorarioFormatado {
  dia: number;
  inicio: number;
  fim: number;
  texto: string;
}

export interface ProgressoCurricular {
  chObrigatoriaExigida: number;
  chObrigatoriaCumprida: number;
  chPerfilExigida: number;
  chPerfilBruta: number;
  chPerfilAproveitada: number;
  chExcedentePerfilParaLivre: number;
  chLivresExigida: number;
  chLivresDireta: number;
  chLivresTotalCumprida: number;
}

export interface MatriculaAlunoItem {
  idMatricula: number;
  idTurma: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  classificacaoNoCurso: "obrigatoria" | "perfil" | "livre";
  professor: string;
  statusTurma: "aberta" | "encerrada";
  statusMatricula: "cursando" | "aprovado" | "reprovado" | "cancelada";
  horarios: HorarioFormatado[];
}

export interface DashboardAlunoData {
  tipo: "aluno";
  progresso: ProgressoCurricular;
  matriculasAtivas: MatriculaAlunoItem[];
  historico: MatriculaAlunoItem[];
}

export interface TurmaProfessorItem {
  id: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  vagas: number;
  ocupadas: number;
  totalHistorico: number;
  status: "aberta" | "encerrada";
  horarios: HorarioFormatado[];
}

export interface DashboardProfessorData {
  tipo: "professor";
  turmas: TurmaProfessorItem[];
}

export interface CursoResumoSecretaria {
  id: number;
  nome: string;
  chPerfil: number;
  chLivres: number;
  totalAlunos: number;
  totalDisciplinasVinculadas: number;
}

export interface TurmaAbertaSecretaria {
  id: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  professor: string;
  vagas: number;
  ocupadas: number;
  horarios: HorarioFormatado[];
}

export interface DashboardServidorData {
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
  cursos: CursoResumoSecretaria[];
  turmasAbertas: TurmaAbertaSecretaria[];
}

export type DashboardData =
  | DashboardAlunoData
  | DashboardProfessorData
  | DashboardServidorData;

export interface RespostaLogins {
  logins: LoginDisponivelSeed[];
  msg?: string;
}

export interface RespostaLogin {
  token: string;
  usuario: UsuarioAutenticado;
  msg?: string;
}

export interface RespostaMe {
  usuario: UsuarioAutenticado;
  dashboard: DashboardData;
  msg?: string;
}
