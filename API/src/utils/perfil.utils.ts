import { TipoDisciplina } from "@prisma/client";

export type PerfilTipo = "aluno" | "professor" | "servidor";

export interface CursoResumoDTO {
  id: number;
  nome: string;
  chPerfil: number;
  chLivres: number;
}

export interface PerfilUsuarioDTO {
  idCadastro: number;
  login: string;
  email: string;
  perfil: PerfilTipo;
  nome: string;
  idPerfil: number;
  curso?: CursoResumoDTO;
  titulacao?: string;
}

export interface CadastroComRelacoes {
  id: number;
  login: string;
  email: string;
  aluno: {
    id: number;
    nome: string;
    curso: {
      id: number;
      nome: string;
      chPerfil: number;
      chLivres: number;
    };
  } | null;
  professor: {
    id: number;
    nome: string;
    titulacao: string;
    email: string;
  } | null;
  servidor: {
    id: number;
    nome: string;
  } | null;
}

export interface ProgressoCurricularDTO {
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

/**
 * Converte um registro de cadastro com suas relações no DTO padronizado de perfil.
 */
export function montarPerfilUsuario(cadastro: CadastroComRelacoes): PerfilUsuarioDTO {
  if (cadastro.aluno) {
    return {
      idCadastro: cadastro.id,
      login: cadastro.login,
      email: cadastro.email,
      perfil: "aluno",
      nome: cadastro.aluno.nome,
      idPerfil: cadastro.aluno.id,
      curso: {
        id: cadastro.aluno.curso.id,
        nome: cadastro.aluno.curso.nome,
        chPerfil: cadastro.aluno.curso.chPerfil,
        chLivres: cadastro.aluno.curso.chLivres,
      },
    };
  }

  if (cadastro.professor) {
    return {
      idCadastro: cadastro.id,
      login: cadastro.login,
      email: cadastro.email,
      perfil: "professor",
      nome: cadastro.professor.nome,
      idPerfil: cadastro.professor.id,
      titulacao: cadastro.professor.titulacao,
    };
  }

  if (cadastro.servidor) {
    return {
      idCadastro: cadastro.id,
      login: cadastro.login,
      email: cadastro.email,
      perfil: "servidor",
      nome: cadastro.servidor.nome,
      idPerfil: cadastro.servidor.id,
    };
  }

  throw new Error(`Cadastro id=${cadastro.id} não possui nenhum perfil associado.`);
}

/**
 * Calcula o progresso curricular de um aluno considerando obrigatórias, perfil
 * e transbordo de carga horária excedente de perfil para eletivas livres.
 */
export function calcularProgressoCurricularAluno(
  chObrigatoriaExigida: number,
  chPerfilExigida: number,
  chLivresExigida: number,
  disciplinasAprovadas: Array<{ idDisciplina: number; cargaHoraria: number }>,
  mapaTiposNoCurso: Map<number, TipoDisciplina>,
): ProgressoCurricularDTO {
  let chObrigatoriaCumprida = 0;
  let chPerfilBruta = 0;
  let chLivresDireta = 0;

  for (const disciplina of disciplinasAprovadas) {
    const tipo = mapaTiposNoCurso.get(disciplina.idDisciplina);
    if (tipo === TipoDisciplina.obrigatoria) {
      chObrigatoriaCumprida += disciplina.cargaHoraria;
    } else if (tipo === TipoDisciplina.perfil) {
      chPerfilBruta += disciplina.cargaHoraria;
    } else {
      chLivresDireta += disciplina.cargaHoraria;
    }
  }

  const chPerfilAproveitada = Math.min(chPerfilBruta, chPerfilExigida);
  const chExcedentePerfilParaLivre = Math.max(0, chPerfilBruta - chPerfilExigida);
  const chLivresTotalCumprida = chLivresDireta + chExcedentePerfilParaLivre;

  return {
    chObrigatoriaExigida,
    chObrigatoriaCumprida,
    chPerfilExigida,
    chPerfilBruta,
    chPerfilAproveitada,
    chExcedentePerfilParaLivre,
    chLivresExigida,
    chLivresDireta,
    chLivresTotalCumprida,
  };
}
