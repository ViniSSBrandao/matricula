export interface HorarioBasico {
  dia: number;
  inicio: number;
  fim: number;
}

const SIGLA_DIA_SEMANA: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
  7: "Dom",
};

const NOME_DIA_SEMANA: Record<number, string> = {
  1: "segunda",
  2: "terça",
  3: "quarta",
  4: "quinta",
  5: "sexta",
  6: "sábado",
  7: "domingo",
};

/**
 * Retorna a sigla curta do dia da semana (1 = Seg ... 7 = Dom).
 */
export function obterSiglaDia(dia: number): string {
  return SIGLA_DIA_SEMANA[dia] ?? `Dia ${dia}`;
}

/**
 * Retorna o nome por extenso do dia da semana para uso em acessibilidade e detalhes.
 */
export function obterNomeDia(dia: number): string {
  return NOME_DIA_SEMANA[dia] ?? `dia ${dia}`;
}

/**
 * Converte minutos desde 00:00 no formato HH:MM (ex.: 840 -> "14:00").
 */
export function formatarMinutosParaHora(minutos: number): string {
  const minutosValidos = Math.max(0, Math.floor(minutos));
  const horas = Math.floor(minutosValidos / 60);
  const mins = minutosValidos % 60;
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Formata um horário com sigla do dia e intervalo com travessão (ex.: "Ter 14:00–16:00").
 */
export function formatarHorario(horario: HorarioBasico): string {
  const dia = obterSiglaDia(horario.dia);
  const inicio = formatarMinutosParaHora(horario.inicio);
  const fim = formatarMinutosParaHora(horario.fim);
  return `${dia} ${inicio}–${fim}`;
}

/**
 * Formata uma lista de horários em string única legível.
 */
export function formatarListaHorarios(horarios: HorarioBasico[]): string {
  if (horarios.length === 0) {
    return "Sem horário definido";
  }
  return horarios.map(formatarHorario).join(" • ");
}
