import type { ReactNode } from "react";

import { MobileNav } from "@/components/navigation/mobile-nav";
import { AppHeader } from "@/components/shared/app-header";
import type { AppViewer } from "@/lib/types/domain";

type AppShellProps = {
  viewer: AppViewer;
  children: ReactNode;
};

export function AppShell({ viewer, children }: AppShellProps) {
  return (
    <>
      <div className="page-shell">
        <AppHeader viewer={viewer} />
        <main className="flex flex-col gap-6">{children}</main>
      </div>
      <MobileNav role={viewer.role} />
    </>
  );
}
