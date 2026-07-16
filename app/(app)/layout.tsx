import { redirect } from "next/navigation";

import { AppShell } from "@/components/shared/app-shell";
import { getAppViewer } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
