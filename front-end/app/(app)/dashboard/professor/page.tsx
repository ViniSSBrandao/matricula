"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardProfessorView } from "@/components/dashboards/DashboardProfessorView";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

export default function DashboardProfessorPage() {
  const router = useRouter();
  const { usuario, dadosMe } = useAuth();

  useEffect(() => {
    if (usuario && usuario.perfil !== "professor") {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    }
  }, [usuario, router]);

  if (!usuario || !dadosMe || dadosMe.dashboard.tipo !== "professor") {
    return null;
  }

  return <DashboardProfessorView usuario={usuario} dados={dadosMe.dashboard} />;
}
