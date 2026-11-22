import { Suspense } from "react";
import { DisciplinasView } from "@/components/secretaria/DisciplinasView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function SecretariaDisciplinasPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando disciplinas..." />}>
      <DisciplinasView />
    </Suspense>
  );
}
