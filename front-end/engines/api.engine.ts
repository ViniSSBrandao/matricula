import axios, { AxiosInstance, AxiosRequestConfig, Method } from "axios";
import {
  ApiMessagePayload,
  ApiRequestOptions,
  ApiToastOption,
  ToastRequestOptions,
} from "@/types/http.types";
import { lerTokenSessao } from "./storage.engine";
import { toastEngine } from "./toast.engine";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);

export function obterApiBaseUrl(): string {
  return API_BASE_URL;
}

export class ApiClientError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly originalError: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      details?: unknown;
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
    this.originalError = options?.originalError;
  }
}

export interface SessionErrorHandlers {
  onUnauthorized?: (erro: ApiClientError) => void;
  onForbidden?: (erro: ApiClientError) => void;
}

const sessionHandlersRegistry = new Set<SessionErrorHandlers>();

/**
 * Registra callbacks globais para respostas 401 (sessão expirada/não autenticada)
 * e 403 (perfil sem permissão), retornando função de cancelamento.
 */
export function registrarHandlersSessao(handlers: SessionErrorHandlers): () => void {
  sessionHandlersRegistry.add(handlers);
  return () => {
    sessionHandlersRegistry.delete(handlers);
  };
}

const CODIGOS_NAO_AUTENTICADO = new Set([
  "UNAUTHORIZED",
  "SESSAO_EXPIRADA",
  "NAO_AUTENTICADO",
]);

const CODIGOS_PERFIL_SEM_ACESSO = new Set(["FORBIDDEN", "PERFIL_SEM_ACESSO"]);

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const possuiAuthExplicito = Boolean(
    config.headers?.Authorization || config.headers?.authorization,
  );
  if (!possuiAuthExplicito) {
    const token = lerTokenSessao();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function extrairDadosErroPayload(payload: unknown): {
  message?: string;
  code?: string;
  details?: unknown;
} {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const dados = payload as ApiMessagePayload;
  const aninhado =
    dados.error && typeof dados.error === "object" ? dados.error : undefined;

  const candidatosMensagem = [
    dados.msg,
    dados.message,
    aninhado?.msg,
    aninhado?.message,
  ];
  const message = candidatosMensagem.find(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  )?.trim();

  const code =
    typeof dados.code === "string" && dados.code.trim().length > 0
      ? dados.code.trim()
      : typeof aninhado?.code === "string" && aninhado.code.trim().length > 0
        ? aninhado.code.trim()
        : undefined;

  const details = dados.details !== undefined ? dados.details : aninhado?.details;

  return { message, code, details };
}

function extrairMensagemMsgEstrita(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const dados = payload as ApiMessagePayload;
  if (typeof dados.msg === "string" && dados.msg.trim().length > 0) {
    return dados.msg.trim();
  }
  return undefined;
}

export function normalizarErroAxios(erro: unknown): ApiClientError {
  if (erro instanceof ApiClientError) {
    return erro;
  }

  if (axios.isAxiosError(erro)) {
    const status = erro.response?.status;
    const { message, code, details } = extrairDadosErroPayload(erro.response?.data);

    if (message) {
      return new ApiClientError(message, {
        status,
        code,
        details,
        originalError: erro,
      });
    }

    if (erro.code === "ECONNABORTED") {
      return new ApiClientError("Tempo de resposta da API esgotado.", {
        status,
        code: "TIMEOUT",
        originalError: erro,
      });
    }

    if (!erro.response) {
      return new ApiClientError(
        "Não foi possível conectar ao servidor da API. Verifique se o back-end está ativo.",
        {
          code: "NETWORK_ERROR",
          originalError: erro,
        },
      );
    }

    return new ApiClientError(`Erro HTTP ${status} ao comunicar com a API.`, {
      status,
      code,
      details,
      originalError: erro,
    });
  }

  if (erro instanceof Error) {
    return new ApiClientError(erro.message, { originalError: erro });
  }

  return new ApiClientError("Ocorreu um erro inesperado na comunicação com a API.", {
    originalError: erro,
  });
}

function ehRotaDeLogin(url: string): boolean {
  const limpa = url.split("?")[0].replace(/\/+$/, "");
  return limpa === "/auth/login" || limpa === "/login";
}

function notificarHandlersSessao(url: string, erro: ApiClientError): void {
  if (erro.status === 401 && !ehRotaDeLogin(url)) {
    if (!erro.code || CODIGOS_NAO_AUTENTICADO.has(erro.code)) {
      sessionHandlersRegistry.forEach((handler) => handler.onUnauthorized?.(erro));
    }
    return;
  }

  if (erro.status === 403) {
    if (!erro.code || CODIGOS_PERFIL_SEM_ACESSO.has(erro.code)) {
      sessionHandlersRegistry.forEach((handler) => handler.onForbidden?.(erro));
    }
  }
}

function notificarSucesso(data: unknown, toast?: ApiToastOption): void {
  if (!toast) {
    return;
  }

  const msgBackend = extrairMensagemMsgEstrita(data);

  if (toast === true) {
    if (msgBackend) {
      toastEngine.success(msgBackend);
    }
    return;
  }

  if (typeof toast.success === "string" && toast.success.trim().length > 0) {
    toastEngine.success(toast.success.trim(), {
      title: toast.successTitle,
      durationMs: toast.durationMs,
    });
    return;
  }

  if (toast.success === true) {
    const mensagem = msgBackend ?? toast.fallbackSuccess;
    if (mensagem) {
      toastEngine.success(mensagem, {
        title: toast.successTitle,
        durationMs: toast.durationMs,
      });
    }
  }
}

function notificarErro(erro: ApiClientError, toast?: ApiToastOption): void {
  if (!toast) {
    return;
  }

  if (toast === true) {
    toastEngine.error(erro.message);
    return;
  }

  if (typeof toast.error === "string" && toast.error.trim().length > 0) {
    toastEngine.error(toast.error.trim(), {
      title: toast.errorTitle,
      durationMs: toast.durationMs,
    });
    return;
  }

  if (toast.error === true) {
    toastEngine.error(erro.message, {
      title: toast.errorTitle,
      durationMs: toast.durationMs,
    });
  }
}

function mesclarToastComPadraoAtivo(toast?: ApiToastOption): ApiToastOption {
  if (toast === false) {
    return false;
  }
  if (!toast || toast === true) {
    return true;
  }
  const opcoes: ToastRequestOptions = {
    success: true,
    error: true,
    ...toast,
  };
  return opcoes;
}

async function executarRequisicao<TResponse>(
  method: Method,
  url: string,
  data?: unknown,
  options?: ApiRequestOptions,
): Promise<TResponse> {
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const config: AxiosRequestConfig = {
    method,
    url,
    data,
    params: options?.params,
    headers,
  };

  try {
    const response = await axiosClient.request<TResponse>(config);
    notificarSucesso(response.data, options?.toast);
    return response.data;
  } catch (erro) {
    const erroNormalizado = normalizarErroAxios(erro);
    notificarHandlersSessao(url, erroNormalizado);
    notificarErro(erroNormalizado, options?.toast);
    throw erroNormalizado;
  }
}

export const apiEngine = {
  request<TResponse>(
    method: Method,
    url: string,
    data?: unknown,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return executarRequisicao<TResponse>(method, url, data, options);
  },

  get<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
    return executarRequisicao<TResponse>("GET", url, undefined, options);
  },

  post<TResponse>(
    url: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return executarRequisicao<TResponse>("POST", url, body, options);
  },

  put<TResponse>(
    url: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return executarRequisicao<TResponse>("PUT", url, body, options);
  },

  patch<TResponse>(
    url: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ): Promise<TResponse> {
    return executarRequisicao<TResponse>("PATCH", url, body, options);
  },

  delete<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
    return executarRequisicao<TResponse>("DELETE", url, undefined, options);
  },

  comToast: {
    get<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
      return executarRequisicao<TResponse>("GET", url, undefined, {
        ...options,
        toast: mesclarToastComPadraoAtivo(options?.toast),
      });
    },
    post<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("POST", url, body, {
        ...options,
        toast: mesclarToastComPadraoAtivo(options?.toast),
      });
    },
    put<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("PUT", url, body, {
        ...options,
        toast: mesclarToastComPadraoAtivo(options?.toast),
      });
    },
    patch<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("PATCH", url, body, {
        ...options,
        toast: mesclarToastComPadraoAtivo(options?.toast),
      });
    },
    delete<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
      return executarRequisicao<TResponse>("DELETE", url, undefined, {
        ...options,
        toast: mesclarToastComPadraoAtivo(options?.toast),
      });
    },
  },

  semToast: {
    get<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
      return executarRequisicao<TResponse>("GET", url, undefined, {
        ...options,
        toast: false,
      });
    },
    post<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("POST", url, body, {
        ...options,
        toast: false,
      });
    },
    put<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("PUT", url, body, {
        ...options,
        toast: false,
      });
    },
    patch<TResponse>(
      url: string,
      body?: unknown,
      options?: ApiRequestOptions,
    ): Promise<TResponse> {
      return executarRequisicao<TResponse>("PATCH", url, body, {
        ...options,
        toast: false,
      });
    },
    delete<TResponse>(url: string, options?: ApiRequestOptions): Promise<TResponse> {
      return executarRequisicao<TResponse>("DELETE", url, undefined, {
        ...options,
        toast: false,
      });
    },
  },
};
