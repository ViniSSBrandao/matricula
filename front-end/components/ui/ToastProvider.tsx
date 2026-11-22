"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { toastEngine } from "@/engines/toast.engine";
import { ToastItem, ToastVariant } from "@/types/http.types";

const ESTILOS_VARIANTE: Record<
  ToastVariant,
  { container: string; barra: string; titulo: string; icone: string }
> = {
  success: {
    container: "border-emerald-200 bg-white text-slate-900",
    barra: "bg-emerald-500",
    titulo: "text-emerald-800",
    icone: "bg-emerald-100 text-emerald-700",
  },
  error: {
    container: "border-rose-200 bg-white text-slate-900",
    barra: "bg-rose-500",
    titulo: "text-rose-800",
    icone: "bg-rose-100 text-rose-700",
  },
  warning: {
    container: "border-amber-200 bg-white text-slate-900",
    barra: "bg-amber-500",
    titulo: "text-amber-800",
    icone: "bg-amber-100 text-amber-700",
  },
  info: {
    container: "border-sky-200 bg-white text-slate-900",
    barra: "bg-sky-500",
    titulo: "text-sky-800",
    icone: "bg-sky-100 text-sky-700",
  },
};

const TITULO_PADRAO: Record<ToastVariant, string> = {
  success: "Sucesso",
  error: "Não foi possível concluir",
  warning: "Atenção",
  info: "Informação",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.415 0l-3.6-3.6a1 1 0 111.414-1.42l2.893 2.894 6.494-6.494a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (variant === "error") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm.25-7.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;

    const unsubscribe = toastEngine.subscribe((evento) => {
      if (evento.type === "ADD") {
        const novoToast = evento.toast;
        setToasts((atual) => [...atual.slice(-4), novoToast]);

        const timer = setTimeout(() => {
          timers.delete(novoToast.id);
          setToasts((atual) => atual.filter((item) => item.id !== novoToast.id));
        }, novoToast.durationMs);

        timers.set(novoToast.id, timer);
        return;
      }

      if (evento.type === "DISMISS") {
        const timer = timers.get(evento.id);
        if (timer) {
          clearTimeout(timer);
          timers.delete(evento.id);
        }
        setToasts((atual) => atual.filter((item) => item.id !== evento.id));
        return;
      }

      if (evento.type === "CLEAR") {
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
        setToasts([]);
      }
    });

    return () => {
      unsubscribe();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5"
      >
        {toasts.map((toast) => {
          const estilo = ESTILOS_VARIANTE[toast.variant];
          const titulo = toast.title ?? TITULO_PADRAO[toast.variant];

          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-toast-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border p-3.5 shadow-lg shadow-slate-900/10 ${estilo.container}`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${estilo.barra}`} />
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${estilo.icone}`}
              >
                <ToastIcon variant={toast.variant} />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <p className={`text-xs font-semibold ${estilo.titulo}`}>{titulo}</p>
                <p className="mt-0.5 text-sm leading-snug text-slate-700">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => toastEngine.dismiss(toast.id)}
                aria-label="Fechar notificação"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
