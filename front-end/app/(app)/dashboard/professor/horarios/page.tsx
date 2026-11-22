import { Suspense } from "react";
import { HorariosProfessorView } from "@/components/professor/HorariosProfessorView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function ProfessorHorariosPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando meus horários..." />}>
      <HorariosProfessorView />
    </Suspense>
  );
}
