import {
  LoginDisponivelSeed,
  RespostaMe,
  UsuarioAutenticado,
} from "./auth.types";

const STORAGE_TOKEN_KEY = "sistema_matricula_token";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

export const LOGINS_SEED_FALLBACK: LoginDisponivelSeed[] = [
  {
    login: "secretaria",
    perfil: "servidor",
    nome: "Marcos Ribeiro",
    detalhe: "Secretaria Acadêmica",
    email: "secretaria@ufpe.br",
  },
  {
    login: "ricardo.prof",
    perfil: "professor",
    nome: "Prof. Ricardo Almeida",
    detalhe: "Doutor",
    email: "ricardo.almeida@ufpe.br",
  },
  {
    login: "ana.cc",
    perfil: "aluno",
    nome: "Ana Beatriz Souza",
    detalhe: "Ciência da Computação",
    email: "ana.cc@ufpe.br",
  },
  {
    login: "bruno.cc",
    perfil: "aluno",
    nome: "Bruno Oliveira",
    detalhe: "Ciência da Computação",
    email: "bruno.cc@ufpe.br",
  },
  {
    login: "carla.ec",
    perfil: "aluno",
    nome: "Carla Mendes",
    detalhe: "Engenharia da Computação",
    email: "carla.ec@ufpe.br",
  },
  {
    login: "diego.ec",
    perfil: "aluno",
    nome: "Diego Ferreira",
    detalhe: "Engenharia da Computação",
    email: "diego.ec@ufpe.br",
  },
];

async function parseRespostaJson<T>(res: Response): Promise<T> {
  const texto = await res.text();
  const payload = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};

  if (!res.ok) {
    const mensagem =
      typeof payload.message === "string"
        ? payload.message
        : `Erro HTTP ${res.status} ao comunicar com a API.`;
    throw new Error(mensagem);
  }

  return payload as T;
}

/**
 * Busca a lista de logins cadastrados no banco para atalhos na tela de login.
 */
export async function buscarLoginsSeed(): Promise<{
  logins: LoginDisponivelSeed[];
  origemApi: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logins`, {
      method: "GET",
      cache: "no-store",
    });
    const dados = await parseRespostaJson<{ logins: LoginDisponivelSeed[] }>(res);
    return { logins: dados.logins, origemApi: true };
  } catch {
    return { logins: LOGINS_SEED_FALLBACK, origemApi: false };
  }
}

/**
 * Realiza login sem senha enviando apenas o campo login.
 */
export async function realizarLoginSemSenha(login: string): Promise<{
  token: string;
  usuario: UsuarioAutenticado;
}> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: login.trim() }),
  });

  return parseRespostaJson<{ token: string; usuario: UsuarioAutenticado }>(res);
}

/**
 * Busca os dados atualizados do usuário autenticado e seu dashboard inicial.
 */
export async function buscarDadosDashboard(token: string): Promise<RespostaMe> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseRespostaJson<RespostaMe>(res);
}

export function obterApiBaseUrl(): string {
  return API_BASE_URL;
}

export function salvarTokenSessao(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
  }
}

export function lerTokenSessao(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_TOKEN_KEY);
}

export function limparTokenSessao(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_TOKEN_KEY);
  }
}
