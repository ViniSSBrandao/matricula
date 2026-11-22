"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { registrarHandlersSessao } from "@/engines/api.engine";
import {
  lerTokenSessao,
  limparTokenSessao,
  salvarTokenSessao,
} from "@/engines/storage.engine";
import { toastEngine } from "@/engines/toast.engine";
import { authService } from "@/services/auth.service";
import { RespostaMe, UsuarioAutenticado } from "@/types/auth.types";
import { ApiToastOption } from "@/types/http.types";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

interface AuthContextValue {
  token: string | null;
  dadosMe: RespostaMe | null;
  usuario: UsuarioAutenticado | null;
  carregandoSessao: boolean;
  carregandoAcao: boolean;
  signIn: (login: string, toastOverride?: ApiToastOption) => Promise<UsuarioAutenticado>;
  refreshDashboard: (exibirToast?: boolean) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [dadosMe, setDadosMe] = useState<RespostaMe | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  const usuarioAtualRef = useRef<UsuarioAutenticado | null>(null);
  const tratando401Ref = useRef(false);

  useEffect(() => {
    usuarioAtualRef.current = dadosMe?.usuario ?? null;
  }, [dadosMe]);

  useEffect(() => {
    const desregistrar = registrarHandlersSessao({
      onUnauthorized: () => {
        if (tratando401Ref.current) {
          return;
        }
        tratando401Ref.current = true;
        limparTokenSessao();
        setToken(null);
        setDadosMe(null);
        toastEngine.warning("Sua sessão expirou. Faça login novamente.");
        router.replace("/login");
      },
      onForbidden: () => {
        const usuarioAtual = usuarioAtualRef.current;
        toastEngine.warning("Você não tem permissão para acessar este recurso.");
        if (usuarioAtual) {
          router.replace(obterRotaDashboardPorPerfil(usuarioAtual.perfil));
        }
      },
    });

    return desregistrar;
  }, [router]);

  useEffect(() => {
    let ativo = true;

    async function inicializarSessao() {
      const tokenSalvo = lerTokenSessao();
      if (!tokenSalvo) {
        if (ativo) {
          setCarregandoSessao(false);
        }
        return;
      }

      try {
        const resposta = await authService.buscarSessaoAtual({
          token: tokenSalvo,
          toast: false,
        });
        if (!ativo) return;
        tratando401Ref.current = false;
        setToken(tokenSalvo);
        setDadosMe(resposta);
      } catch {
        limparTokenSessao();
        if (ativo) {
          setToken(null);
          setDadosMe(null);
        }
      } finally {
        if (ativo) {
          setCarregandoSessao(false);
        }
      }
    }

    void inicializarSessao();

    return () => {
      ativo = false;
    };
  }, []);

  const signIn = useCallback(
    async (login: string, toastOverride?: ApiToastOption): Promise<UsuarioAutenticado> => {
      setCarregandoAcao(true);
      try {
        const { token: novoToken } = await authService.autenticarPorLogin(login, toastOverride);
        const respostaMe = await authService.buscarSessaoAtual({
          token: novoToken,
          toast: false,
        });
        tratando401Ref.current = false;
        salvarTokenSessao(novoToken);
        setToken(novoToken);
        setDadosMe(respostaMe);
        return respostaMe.usuario;
      } finally {
        setCarregandoAcao(false);
      }
    },
    [],
  );

  const refreshDashboard = useCallback(
    async (exibirToast = true): Promise<void> => {
      if (!token) return;
      setCarregandoAcao(true);
      try {
        const respostaMe = await authService.buscarSessaoAtual({
          token,
          toast: exibirToast
            ? {
                success: true,
                fallbackSuccess: "Dados atualizados com sucesso.",
                error: true,
              }
            : false,
        });
        setDadosMe(respostaMe);
      } finally {
        setCarregandoAcao(false);
      }
    },
    [token],
  );

  const signOut = useCallback(() => {
    limparTokenSessao();
    setToken(null);
    setDadosMe(null);
    toastEngine.info("Você saiu da sua conta.");
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        dadosMe,
        usuario: dadosMe?.usuario ?? null,
        carregandoSessao,
        carregandoAcao,
        signIn,
        refreshDashboard,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider.");
  }
  return ctx;
}
