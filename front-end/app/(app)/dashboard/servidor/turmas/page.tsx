import { Suspense } from "react";
import { TurmasView } from "@/components/secretaria/TurmasView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function SecretariaTurmasPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando turmas..." />}>
      <TurmasView />
    </Suspense>
  );
}
