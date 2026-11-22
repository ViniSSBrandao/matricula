import { ReactNode } from "react";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function AlunoAreaLayout({ children }: { children: ReactNode }) {
  return <ProfileGuard perfilPermitido="aluno">{children}</ProfileGuard>;
}
