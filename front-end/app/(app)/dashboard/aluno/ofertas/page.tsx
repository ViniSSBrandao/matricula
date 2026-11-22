import { Suspense } from "react";
import { OfertasView } from "@/components/aluno/OfertasView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function AlunoOfertasPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando disciplinas ofertadas..." />}>
      <OfertasView />
    </Suspense>
  );
}
