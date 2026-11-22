import { Suspense } from "react";
import { ProfessoresView } from "@/components/secretaria/ProfessoresView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function SecretariaProfessoresPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando professores..." />}>
      <ProfessoresView />
    </Suspense>
  );
}
