import { ReactNode } from "react";
import { AuthLayoutShell } from "@/components/layout/AuthLayoutShell";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
