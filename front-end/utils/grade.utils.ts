import { BlocoGrade, ClassificacaoDisciplina } from "@/types/aluno.types";
import { formatarMinutosParaHora, obterNomeDia } from "./horario.utils";

export const DIAS_UTEIS = [1, 2, 3, 4, 5] as const;
export const DIAS_SEMANA_SEM_DOMINGO = [1, 2, 3, 4, 5, 6] as const;

export interface BlocoHorarioBasico {
  dia: number;
  inicio: number;
  fim: number;
}

const ROTULO_CLASSIFICACAO_CURTO: Record<ClassificacaoDisciplina, string> = {
  obrigatoria: "Obrigatória",
  perfil: "Eletiva de perfil",
  livre: "Eletiva livre",
};

/**
 * Remove blocos de domingo (dia 7) ou dias fora do intervalo 1..6.
 */
export function filtrarBlocosSemDomingo<T extends BlocoHorarioBasico>(
  blocos: T[],
): T[] {
  return blocos.filter((bloco) => bloco.dia >= 1 && bloco.dia <= 6);
}

/**
 * Retorna os dias exibidos como colunas no desktop:
 * Segunda a Sexta sempre; Sábado apenas se houver aula nele. Domingo nunca aparece.
 */
export function obterColunasDesktop<T extends BlocoHorarioBasico>(
  blocos: T[],
): number[] {
  const temSabado = blocos.some((bloco) => bloco.dia === 6);
  return temSabado ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
}

export interface FaixaEixoGrade {
  inicioMin: number;
  fimMin: number;
  horas: number[];
}

/**
 * Calcula a faixa vertical em minutos da grade (de 1h cheia antes do primeiro início
 * até 1h cheia depois do último fim; padrão 08:00–18:00 quando não houver blocos).
 */
export function calcularFaixaEixo<T extends BlocoHorarioBasico>(
  blocos: T[],
): FaixaEixoGrade {
  const blocosValidos = filtrarBlocosSemDomingo(blocos);

  if (blocosValidos.length === 0) {
    const inicioMin = 480;
    const fimMin = 1080;
    const horas = Array.from({ length: 11 }, (_, idx) => 8 + idx);
    return { inicioMin, fimMin, horas };
  }

  let menorInicio = Infinity;
  let maiorFim = -Infinity;

  for (const bloco of blocosValidos) {
    if (bloco.inicio < menorInicio) menorInicio = bloco.inicio;
    if (bloco.fim > maiorFim) maiorFim = bloco.fim;
  }

  const inicioHora = Math.max(0, Math.floor(menorInicio / 60) - 1);
  const fimHora = Math.min(24, Math.ceil(maiorFim / 60) + 1);

  const inicioMin = inicioHora * 60;
  const fimMin = Math.max(inicioMin + 60, fimHora * 60);

  const quantidadeHoras = Math.floor((fimMin - inicioMin) / 60) + 1;
  const horas = Array.from({ length: quantidadeHoras }, (_, idx) => inicioHora + idx);

  return { inicioMin, fimMin, horas };
}

export interface PosicaoBlocoGrade {
  topPercent: number;
  heightPercent: number;
}

/**
 * Converte início e fim em minutos para posição e altura proporcionais (%).
 */
export function calcularPosicaoBloco(
  bloco: { inicio: number; fim: number },
  inicioMin: number,
  fimMin: number,
): PosicaoBlocoGrade {
  const duracaoTotal = Math.max(60, fimMin - inicioMin);
  const inicioLimitado = Math.max(inicioMin, Math.min(fimMin, bloco.inicio));
  const fimLimitado = Math.max(inicioLimitado, Math.min(fimMin, bloco.fim));

  const topPercent = ((inicioLimitado - inicioMin) / duracaoTotal) * 100;
  const heightPercent = Math.max(
    4,
    ((fimLimitado - inicioLimitado) / duracaoTotal) * 100,
  );

  return { topPercent, heightPercent };
}

/**
 * Agrupa os blocos por dia (1..6, excluindo domingo) ordenados por horário de início.
 */
export function agruparBlocosPorDia<T extends BlocoHorarioBasico>(
  blocos: T[],
): Record<number, T[]> {
  const agrupado: Record<number, T[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  for (const bloco of filtrarBlocosSemDomingo(blocos)) {
    agrupado[bloco.dia].push(bloco);
  }

  for (const dia of DIAS_SEMANA_SEM_DOMINGO) {
    agrupado[dia].sort((a, b) => a.inicio - b.inicio);
  }

  return agrupado;
}

/**
 * Seleciona o dia inicial para a visão mobile:
 * 1) `?dia=1..6` na URL se válido;
 * 2) dia atual (Seg–Sáb) se tiver aula;
 * 3) primeiro dia (Seg–Sáb) com aula;
 * 4) segunda-feira (1).
 */
export function obterDiaInicialMobile<T extends BlocoHorarioBasico>(
  blocosPorDia: Record<number, T[]>,
  diaParam: string | null,
  dataAtual: Date = new Date(),
): number {
  if (diaParam) {
    const parsed = Number.parseInt(diaParam, 10);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 6) {
      return parsed;
    }
  }

  const diaJs = dataAtual.getDay(); // 0=Dom, 1=Seg ... 6=Sáb
  if (diaJs >= 1 && diaJs <= 6 && (blocosPorDia[diaJs]?.length ?? 0) > 0) {
    return diaJs;
  }

  for (const dia of DIAS_SEMANA_SEM_DOMINGO) {
    if ((blocosPorDia[dia]?.length ?? 0) > 0) {
      return dia;
    }
  }

  return 1;
}

/**
 * Gera o aria-label completo para o botão do bloco na grade semanal do aluno.
 */
export function montarAriaLabelBloco(bloco: BlocoGrade): string {
  const diaExtenso = obterNomeDia(bloco.dia);
  const inicio = formatarMinutosParaHora(bloco.inicio);
  const fim = formatarMinutosParaHora(bloco.fim);
  const classificacao = ROTULO_CLASSIFICACAO_CURTO[bloco.classificacao].toLowerCase();
  return `${bloco.disciplina.codigo} ${bloco.disciplina.nome}, ${diaExtenso}, ${inicio} às ${fim}, ${classificacao}`;
}
