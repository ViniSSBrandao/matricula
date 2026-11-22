"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PerfilTipo } from "@/types/auth.types";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

interface ProfileGuardProps {
  perfilPermitido: PerfilTipo;
  children: ReactNode;
}

/**
 * Impede que um perfil acesse rotas exclusivas de outro perfil,
 * redirecionando imediatamente para a área do próprio usuário.
 */
export function ProfileGuard({ perfilPermitido, children }: ProfileGuardProps) {
  const router = useRouter();
  const { usuario, carregandoSessao } = useAuth();

  useEffect(() => {
    if (!carregandoSessao && usuario && usuario.perfil !== perfilPermitido) {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    }
  }, [carregandoSessao, perfilPermitido, router, usuario]);

  if (carregandoSessao || !usuario || usuario.perfil !== perfilPermitido) {
    return null;
  }

  return <>{children}</>;
}
