export type TipoVinculoDisciplina = "obrigatoria" | "perfil";
export type ClassificacaoDisciplina = "obrigatoria" | "perfil" | "livre";

export interface DisciplinaProgressoInput {
  idDisciplina: number;
  cargaHoraria: number;
  tipo: TipoVinculoDisciplina | null;
}

export interface CalcularProgressoInput {
  chObrigatoriaTotal: number;
  chPerfil: number;
  chLivres: number;
  aprovadas: DisciplinaProgressoInput[];
  cursando: DisciplinaProgressoInput[];
}

export interface GrupoProgressoDTO {
  exigida: number;
  integralizada: number;
  emCurso: number;
  falta: number;
  percentual: number;
}

export interface ProgressoDTO {
  obrigatorias: GrupoProgressoDTO;
  perfil: GrupoProgressoDTO;
  livres: GrupoProgressoDTO;
}

/**
 * Classifica uma disciplina para um curso específico.
 * Ausência de vínculo na estrutura do curso equivale a eletiva livre.
 */
export function classificarDisciplina(
  tipo: TipoVinculoDisciplina | null | undefined,
): ClassificacaoDisciplina {
  if (tipo === "obrigatoria") {
    return "obrigatoria";
  }
  if (tipo === "perfil") {
    return "perfil";
  }
  return "livre";
}

function deduplicarPorDisciplina(
  itens: DisciplinaProgressoInput[],
): DisciplinaProgressoInput[] {
  const mapa = new Map<number, DisciplinaProgressoInput>();
  for (const item of itens) {
    if (!mapa.has(item.idDisciplina)) {
      mapa.set(item.idDisciplina, item);
    }
  }
  return Array.from(mapa.values());
}

function montarGrupoProgresso(
  exigida: number,
  integralizada: number,
  emCurso: number,
): GrupoProgressoDTO {
  const falta = Math.max(0, exigida - integralizada);
  const percentual =
    exigida === 0
      ? 100
      : Math.min(100, Math.round((integralizada / exigida) * 10000) / 100);

  return {
    exigida,
    integralizada,
    emCurso,
    falta,
    percentual,
  };
}

/**
 * Calcula o progresso curricular do aluno por grupo (obrigatórias, perfil e livres),
 * aplicando transbordo do excedente de perfil aprovado para eletivas livres.
 */
export function calcularProgresso(input: CalcularProgressoInput): ProgressoDTO {
  const aprovadasUnicas = deduplicarPorDisciplina(input.aprovadas);
  const cursandoUnicas = deduplicarPorDisciplina(input.cursando);

  let obrigatoriasIntegralizada = 0;
  let perfilBruto = 0;
  let livresDireta = 0;

  for (const disciplina of aprovadasUnicas) {
    const grupo = classificarDisciplina(disciplina.tipo);
    if (grupo === "obrigatoria") {
      obrigatoriasIntegralizada += disciplina.cargaHoraria;
    } else if (grupo === "perfil") {
      perfilBruto += disciplina.cargaHoraria;
    } else {
      livresDireta += disciplina.cargaHoraria;
    }
  }

  const perfilIntegralizado = Math.min(perfilBruto, input.chPerfil);
  const excedentePerfil = Math.max(0, perfilBruto - input.chPerfil);
  const livresIntegralizada = livresDireta + excedentePerfil;

  let obrigatoriasEmCurso = 0;
  let perfilEmCurso = 0;
  let livresEmCurso = 0;

  for (const disciplina of cursandoUnicas) {
    const grupo = classificarDisciplina(disciplina.tipo);
    if (grupo === "obrigatoria") {
      obrigatoriasEmCurso += disciplina.cargaHoraria;
    } else if (grupo === "perfil") {
      perfilEmCurso += disciplina.cargaHoraria;
    } else {
      livresEmCurso += disciplina.cargaHoraria;
    }
  }

  return {
    obrigatorias: montarGrupoProgresso(
      input.chObrigatoriaTotal,
      obrigatoriasIntegralizada,
      obrigatoriasEmCurso,
    ),
    perfil: montarGrupoProgresso(input.chPerfil, perfilIntegralizado, perfilEmCurso),
    livres: montarGrupoProgresso(input.chLivres, livresIntegralizada, livresEmCurso),
  };
}
