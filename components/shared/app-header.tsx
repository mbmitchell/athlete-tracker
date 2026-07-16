import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNavigationItems } from "@/lib/auth/navigation";
import { roleLabels } from "@/lib/auth/roles";
import type { AppViewer } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  viewer: AppViewer;
};

export function AppHeader({ viewer }: AppHeaderProps) {
  const items = getNavigationItems(viewer.role);

  return (
    <header className="section-card sticky top-3 z-30 overflow-hidden">
      <div className="flex flex-col gap-4 bg-gradient-to-r from-primary/95 via-primary to-sky-700 px-5 py-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="pill-label bg-white/15 text-white">Athlete Development Hub</div>
            <div>
              <p className="text-sm text-white/80">{roleLabels[viewer.role]}</p>
              <h1 className="text-xl font-semibold sm:text-2xl">{viewer.displayName}</h1>
            </div>
          </div>
          {viewer.mode === "demo" ? (
            <Badge className="bg-white/15 text-white" variant="outline">
              Demo Preview
            </Badge>
          ) : (
            <form action={signOutAction}>
              <Button className="border-white/20 bg-white/10 text-white hover:bg-white/20" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          )}
        </div>
        <div className="hidden gap-2 sm:flex">
          {items.map((item) => (
            <Link
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "bg-white/15 text-white hover:bg-white/20"
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
