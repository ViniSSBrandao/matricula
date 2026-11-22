import { Suspense } from "react";
import { HorariosView } from "@/components/aluno/HorariosView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function AlunoHorariosPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando meus horários..." />}>
      <HorariosView />
    </Suspense>
  );
}
