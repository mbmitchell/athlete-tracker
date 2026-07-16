import type { ReactNode } from "react";

import { AthleteAccessBlockedCard } from "@/components/auth/athlete-access-blocked-card";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { AppHeader } from "@/components/shared/app-header";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import type { AppViewer } from "@/lib/types/domain";

type AppShellProps = {
  viewer: AppViewer;
  children: ReactNode;
};

export function AppShell({ viewer, children }: AppShellProps) {
  if (viewer.role === "athlete" && viewer.accessState !== "active") {
    return <AthleteAccessBlockedCard viewer={viewer} />;
  }

  return (
    <>
      <div className="page-shell">
        <AppHeader viewer={viewer} />
        {viewer.mode === "demo" ? <DemoModeBanner /> : null}
        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
      <MobileNav role={viewer.role} />
    </>
  );
}
