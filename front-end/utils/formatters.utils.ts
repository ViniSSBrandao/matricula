import { HorarioFormatado, PerfilTipo } from "./auth.types";

const ROTULO_PERFIL: Record<PerfilTipo, string> = {
  aluno: "Aluno(a)",
  professor: "Docente",
  servidor: "Secretaria",
};

const CLASSE_PERFIL: Record<PerfilTipo, string> = {
  aluno: "bg-sky-100 text-sky-800 border-sky-200",
  professor: "bg-violet-100 text-violet-800 border-violet-200",
  servidor: "bg-amber-100 text-amber-800 border-amber-200",
};

export function formatarRotuloPerfil(perfil: PerfilTipo): string {
  return ROTULO_PERFIL[perfil];
}

export function obterClasseBadgePerfil(perfil: PerfilTipo): string {
  return CLASSE_PERFIL[perfil];
}

export function calcularPercentualCh(cumprida: number, exigida: number): number {
  if (exigida <= 0) {
    return 100;
  }
  return Math.min(100, Math.round((cumprida / exigida) * 100));
}

export function formatarResumoHorarios(horarios: HorarioFormatado[]): string {
  if (horarios.length === 0) {
    return "Sem horário cadastrado";
  }
  return horarios.map((h) => h.texto).join(" • ");
}
