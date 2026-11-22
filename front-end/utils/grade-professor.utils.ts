import { TurmaProfessorItem } from "@/types/auth.types";
import { BlocoHorarioBasico, filtrarBlocosSemDomingo } from "./grade.utils";
import { formatarMinutosParaHora, obterNomeDia } from "./horario.utils";

export interface BlocoGradeProfessor extends BlocoHorarioBasico {
  idTurma: number;
  codigoDisciplina: string;
  nomeDisciplina: string;
  cargaHoraria: number;
  vagas: number;
  ocupadas: number;
}

export interface GradeProfessorResult {
  blocos: BlocoGradeProfessor[];
  semHorario: TurmaProfessorItem[];
}

/**
 * Constrói os blocos semanais (excluindo domingo) e a lista sem horário
 * a partir das turmas abertas alocadas ao docente.
 */
export function montarGradeProfessor(
  turmas: TurmaProfessorItem[],
): GradeProfessorResult {
  const turmasAbertas = turmas.filter((turma) => turma.status === "aberta");
  const blocos: BlocoGradeProfessor[] = [];
  const semHorario: TurmaProfessorItem[] = [];

  for (const turma of turmasAbertas) {
    const horariosValidos = filtrarBlocosSemDomingo(turma.horarios);
    if (turma.horarios.length === 0) {
      semHorario.push(turma);
      continue;
    }

    for (const horario of horariosValidos) {
      blocos.push({
        idTurma: turma.id,
        codigoDisciplina: turma.codigoDisciplina,
        nomeDisciplina: turma.nomeDisciplina,
        cargaHoraria: turma.cargaHoraria,
        vagas: turma.vagas,
        ocupadas: turma.ocupadas,
        dia: horario.dia,
        inicio: horario.inicio,
        fim: horario.fim,
      });
    }
  }

  blocos.sort((a, b) => (a.dia !== b.dia ? a.dia - b.dia : a.inicio - b.inicio));

  return { blocos, semHorario };
}

/**
 * Gera o aria-label completo para o botão do bloco na grade semanal do professor.
 */
export function montarAriaLabelBlocoProfessor(bloco: BlocoGradeProfessor): string {
  const diaExtenso = obterNomeDia(bloco.dia);
  const inicio = formatarMinutosParaHora(bloco.inicio);
  const fim = formatarMinutosParaHora(bloco.fim);
  return `${bloco.codigoDisciplina} ${bloco.nomeDisciplina}, ${diaExtenso}, ${inicio} às ${fim}, ${bloco.ocupadas} de ${bloco.vagas} alunos matriculados`;
}
