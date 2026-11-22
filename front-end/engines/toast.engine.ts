import { ToastItem, ToastVariant } from "@/types/http.types";

export interface ToastDispatchOptions {
  title?: string;
  durationMs?: number;
}

export type ToastEvent =
  | { type: "ADD"; toast: ToastItem }
  | { type: "DISMISS"; id: string }
  | { type: "CLEAR" };

type ToastListener = (event: ToastEvent) => void;

const DEFAULT_DURATION_MS = 4500;
let sequenciaToast = 0;
const listeners = new Set<ToastListener>();

function gerarIdToast(): string {
  sequenciaToast += 1;
  return `toast-${Date.now()}-${sequenciaToast}`;
}

function emitir(evento: ToastEvent): void {
  listeners.forEach((listener) => listener(evento));
}

function show(variant: ToastVariant, message: string, options?: ToastDispatchOptions): string {
  const id = gerarIdToast();
  emitir({
    type: "ADD",
    toast: {
      id,
      variant,
      title: options?.title,
      message,
      durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    },
  });
  return id;
}

export const toastEngine = {
  show,
  success(message: string, options?: ToastDispatchOptions): string {
    return show("success", message, options);
  },
  error(message: string, options?: ToastDispatchOptions): string {
    return show("error", message, options);
  },
  info(message: string, options?: ToastDispatchOptions): string {
    return show("info", message, options);
  },
  warning(message: string, options?: ToastDispatchOptions): string {
    return show("warning", message, options);
  },
  dismiss(id: string): void {
    emitir({ type: "DISMISS", id });
  },
  clear(): void {
    emitir({ type: "CLEAR" });
  },
  subscribe(listener: ToastListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
