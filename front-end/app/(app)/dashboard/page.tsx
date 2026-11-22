"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { usuario, carregandoSessao } = useAuth();

  useEffect(() => {
    if (carregandoSessao) return;
    if (!usuario) {
      router.replace("/login");
      return;
    }
    router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
  }, [carregandoSessao, usuario, router]);

  return <LoadingScreen message="Direcionando para o seu painel..." />;
}
