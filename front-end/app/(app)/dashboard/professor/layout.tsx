import { ReactNode } from "react";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function ProfessorAreaLayout({ children }: { children: ReactNode }) {
  return <ProfileGuard perfilPermitido="professor">{children}</ProfileGuard>;
}
