import { apiEngine } from "@/engines/api.engine";
import {
  CursoCatalogo,
  LoginDisponivelSeed,
  PayloadRegistro,
  RespostaLogin,
  RespostaLogins,
  RespostaMe,
} from "@/types/auth.types";
import { ApiRequestOptions, ApiToastOption } from "@/types/http.types";

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

export async function listarLoginsDisponiveis(options?: {
  toast?: ApiToastOption;
}): Promise<{
  logins: LoginDisponivelSeed[];
  origemApi: boolean;
}> {
  try {
    const dados = options?.toast
      ? await apiEngine.get<RespostaLogins>("/auth/logins", { toast: options.toast })
      : await apiEngine.semToast.get<RespostaLogins>("/auth/logins");

    return { logins: dados.logins, origemApi: true };
  } catch {
    return { logins: LOGINS_SEED_FALLBACK, origemApi: false };
  }
}

export async function autenticarPorLogin(
  login: string,
  toast?: ApiToastOption,
): Promise<RespostaLogin> {
  const body = { login: login.trim() };

  if (toast === false) {
    return apiEngine.semToast.post<RespostaLogin>("/auth/login", body);
  }

  return apiEngine.comToast.post<RespostaLogin>("/auth/login", body, {
    toast: toast ?? {
      success: true,
      fallbackSuccess: "Sessão iniciada com sucesso.",
      error: true,
    },
  });
}

export async function buscarSessaoAtual(options?: ApiRequestOptions): Promise<RespostaMe> {
  return apiEngine.get<RespostaMe>("/auth/me", options);
}

export async function listarCursos(): Promise<{ items: CursoCatalogo[] }> {
  return apiEngine.semToast.get<{ items: CursoCatalogo[] }>("/cursos");
}

export async function registrarConta(payload: PayloadRegistro): Promise<RespostaLogin> {
  return apiEngine.semToast.post<RespostaLogin>("/auth/register", payload);
}

export const authService = {
  listarLoginsDisponiveis,
  autenticarPorLogin,
  buscarSessaoAtual,
  listarCursos,
  registrarConta,
};
