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
  public readonly originalError: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.code = options?.code;
    this.originalError = options?.originalError;
  }
}

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

function extrairMensagemPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const dados = payload as ApiMessagePayload;
  if (typeof dados.msg === "string" && dados.msg.trim().length > 0) {
    return dados.msg.trim();
  }
  if (typeof dados.message === "string" && dados.message.trim().length > 0) {
    return dados.message.trim();
  }
  return undefined;
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

function normalizarErroAxios(erro: unknown): ApiClientError {
  if (erro instanceof ApiClientError) {
    return erro;
  }

  if (axios.isAxiosError(erro)) {
    const status = erro.response?.status;
    const payload = erro.response?.data as ApiMessagePayload | undefined;
    const mensagemPayload = extrairMensagemPayload(payload);

    if (mensagemPayload) {
      return new ApiClientError(mensagemPayload, {
        status,
        code: typeof payload?.code === "string" ? payload.code : undefined,
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
