const STORAGE_TOKEN_KEY = "sistema_matricula_token";

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
