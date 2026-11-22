"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardServidorView } from "@/components/dashboards/DashboardServidorView";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

export default function DashboardServidorPage() {
  const router = useRouter();
  const { usuario, dadosMe } = useAuth();

  useEffect(() => {
    if (usuario && usuario.perfil !== "servidor") {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    }
  }, [usuario, router]);

  if (!usuario || !dadosMe || dadosMe.dashboard.tipo !== "servidor") {
    return null;
  }

  return <DashboardServidorView dados={dadosMe.dashboard} />;
}
