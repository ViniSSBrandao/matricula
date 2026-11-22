import { HorarioApi } from "./aluno.types";

export interface DisciplinaItem {
  id: number;
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

export interface DisciplinaPayload {
  codigo: string;
  nome: string;
  cargaHoraria: number;
}

export interface ProfessorItem {
  id: number;
  nome: string;
  titulacao: string;
  email: string;
  possuiCadastro: boolean;
  login: string | null;
}

export interface CriarProfessorPayload {
  nome: string;
  email: string;
  titulacao?: string;
}

export interface AlunoItem {
  id: number;
  nome: string;
  curso: {
    id: number;
    nome: string;
  };
  possuiCadastro: boolean;
  login: string | null;
  email: string | null;
}

export interface CriarAlunoPayload {
  nome: string;
  idCurso: number;
}

export interface HorarioTurmaInput {
  dia: number;
  inicio: number;
  fim: number;
}

export interface TurmaSecretariaItem {
  id: number;
  vagas: number;
  ocupadas: number;
  vagasDisponiveis: number;
  status: "aberta" | "encerrada";
  disciplina: DisciplinaItem;
  professor: {
    id: number;
    nome: string;
    titulacao: string;
  };
  horarios: HorarioApi[];
}

export interface CriarTurmaPayload {
  idDisciplina: number;
  idProfessor: number;
  vagas: number;
  horarios: HorarioTurmaInput[];
}
