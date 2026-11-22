export interface SlotHorario {
  dia: number;
  inicio: number;
  fim: number;
}

const DIAS_SEMANA: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
  7: "Dom",
};

/**
 * Converte uma string "HH:MM" para minutos desde 00:00 (0 a 1440).
 */
export function horaParaMinutos(hora: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!match) {
    throw new Error(`Formato de hora inválido: "${hora}". Esperado HH:MM.`);
  }

  const horas = Number(match[1]);
  const minutos = Number(match[2]);

  if (horas < 0 || horas > 24 || minutos < 0 || minutos > 59) {
    throw new Error(`Hora fora do intervalo válido: "${hora}".`);
  }

  const total = horas * 60 + minutos;
  if (total < 0 || total > 1440) {
    throw new Error(`Minutos fora do intervalo [0, 1440]: ${total}.`);
  }

  return total;
}

/**
 * Converte minutos desde 00:00 para o formato "HH:MM".
 */
export function minutosParaHora(minutos: number): string {
  if (!Number.isInteger(minutos) || minutos < 0 || minutos > 1440) {
    throw new Error(`Minutos inválidos para formatação: ${minutos}.`);
  }

  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Verifica se dois intervalos de horário possuem interseção estrita.
 * Intervalos adjacentes (fim de um === início do outro) NÃO chocam.
 */
export function intervalosChocam(a: SlotHorario, b: SlotHorario): boolean {
  if (a.dia !== b.dia) {
    return false;
  }
  return a.inicio < b.fim && b.inicio < a.fim;
}

/**
 * Verifica se existe ao menos um choque entre as listas de horários de duas turmas.
 */
export function turmasChocamHorario(horariosA: SlotHorario[], horariosB: SlotHorario[]): boolean {
  return horariosA.some((slotA) => horariosB.some((slotB) => intervalosChocam(slotA, slotB)));
}

/**
 * Retorna a primeira turma ativa que possui choque de horário com a lista informada.
 * Turmas sem horários nunca conflitam.
 */
export function encontrarConflitoHorario<T extends { horarios: SlotHorario[] }>(
  horariosNova: SlotHorario[],
  turmasAtivas: T[],
): T | undefined {
  if (horariosNova.length === 0) {
    return undefined;
  }

  return turmasAtivas.find((turma) => turmasChocamHorario(horariosNova, turma.horarios));
}

/**
 * Verifica se há sobreposição entre dois slots dentro da mesma lista de horários.
 */
export function horariosInternosChocam(horarios: SlotHorario[]): boolean {
  for (let i = 0; i < horarios.length; i += 1) {
    for (let j = i + 1; j < horarios.length; j += 1) {
      if (intervalosChocam(horarios[i], horarios[j])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Cria e valida um slot de horário compatível com as CHECK constraints da tabela horarios_turma.
 */
export function criarSlotHorario(dia: number, horaInicio: string, horaFim: string): SlotHorario {
  if (!Number.isInteger(dia) || dia < 1 || dia > 7) {
    throw new Error(`Dia inválido (${dia}). Deve estar entre 1 (segunda) e 7 (domingo).`);
  }

  const inicio = horaParaMinutos(horaInicio);
  const fim = horaParaMinutos(horaFim);

  if (inicio < 0 || inicio > 1439) {
    throw new Error(`Início inválido (${inicio}). Deve estar entre 0 e 1439.`);
  }
  if (fim < 1 || fim > 1440) {
    throw new Error(`Fim inválido (${fim}). Deve estar entre 1 e 1440.`);
  }
  if (fim <= inicio) {
    throw new Error(`Intervalo inválido: fim (${horaFim}) deve ser maior que início (${horaInicio}).`);
  }

  return { dia, inicio, fim };
}

/**
 * Formata um slot de horário para exibição humana (ex.: "Seg 08:00-10:00").
 */
export function formatarSlotHorario(slot: SlotHorario): string {
  const nomeDia = DIAS_SEMANA[slot.dia] ?? `Dia ${slot.dia}`;
  return `${nomeDia} ${minutosParaHora(slot.inicio)}-${minutosParaHora(slot.fim)}`;
}
