import { Suspense } from "react";
import { AlunosView } from "@/components/secretaria/AlunosView";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function SecretariaAlunosPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Carregando alunos..." />}>
      <AlunosView />
    </Suspense>
  );
}
