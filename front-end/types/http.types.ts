export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs: number;
}

export interface ToastRequestOptions {
  success?: boolean | string;
  fallbackSuccess?: string;
  error?: boolean | string;
  successTitle?: string;
  errorTitle?: string;
  durationMs?: number;
}

export type ApiToastOption = boolean | ToastRequestOptions;

export interface ApiRequestOptions {
  toast?: ApiToastOption;
  token?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface ApiNestedErrorPayload {
  msg?: string;
  message?: string;
  code?: string;
  details?: unknown;
}

export interface ApiMessagePayload {
  msg?: string;
  message?: string;
  code?: string;
  details?: unknown;
  error?: ApiNestedErrorPayload;
}
