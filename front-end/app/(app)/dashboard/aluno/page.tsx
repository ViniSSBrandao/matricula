"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardAlunoView } from "@/components/dashboards/DashboardAlunoView";
import { useAuth } from "@/contexts/AuthContext";
import { obterRotaDashboardPorPerfil } from "@/utils/formatters.utils";

export default function DashboardAlunoPage() {
  const router = useRouter();
  const { usuario, dadosMe } = useAuth();

  useEffect(() => {
    if (usuario && usuario.perfil !== "aluno") {
      router.replace(obterRotaDashboardPorPerfil(usuario.perfil));
    }
  }, [usuario, router]);

  if (!usuario || !dadosMe || dadosMe.dashboard.tipo !== "aluno") {
    return null;
  }

  return <DashboardAlunoView usuario={usuario} dados={dadosMe.dashboard} />;
}
