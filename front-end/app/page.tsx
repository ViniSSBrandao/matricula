"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

export default function HomePage() {
  const router = useRouter();
  const { usuario, carregandoSessao } = useAuth();

  useEffect(() => {
    if (carregandoSessao) return;
    if (usuario) {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
      return;
    }
    router.replace("/login");
  }, [carregandoSessao, usuario, router]);

  return <LoadingScreen message="Carregando portal acadêmico..." />;
}
