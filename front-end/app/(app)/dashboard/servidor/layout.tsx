import { ReactNode } from "react";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function ServidorAreaLayout({ children }: { children: ReactNode }) {
  return <ProfileGuard perfilPermitido="servidor">{children}</ProfileGuard>;
}
