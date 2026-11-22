import { HorarioFormatado, PerfilTipo } from "@/types/auth.types";
import { formatarListaHorarios } from "./horario.utils";

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

const ROTA_DASHBOARD_PERFIL: Record<PerfilTipo, string> = {
  aluno: "/dashboard/aluno",
  professor: "/dashboard/professor",
  servidor: "/dashboard/servidor",
};

export function formatarRotuloPerfil(perfil: PerfilTipo): string {
  return ROTULO_PERFIL[perfil];
}

export function obterClasseBadgePerfil(perfil: PerfilTipo): string {
  return CLASSE_PERFIL[perfil];
}

export function obterRotaDashboardPorPerfil(perfil: PerfilTipo): string {
  return ROTA_DASHBOARD_PERFIL[perfil];
}

export function obterIniciaisNome(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 0 && !/^(prof\.?|profa\.?|dr\.?|dra\.?)$/i.test(parte));

  if (partes.length === 0) {
    return "US";
  }
  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function calcularPercentualCh(cumprida: number, exigida: number): number {
  if (exigida <= 0) {
    return 100;
  }
  return Math.min(100, Math.round((cumprida / exigida) * 100));
}

export function formatarResumoHorarios(horarios: HorarioFormatado[]): string {
  return formatarListaHorarios(horarios);
}
