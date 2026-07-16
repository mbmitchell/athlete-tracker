import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getAdminSetupSummary } from "@/lib/data/athletes";
import { cn } from "@/lib/utils";

export default async function AdminSetupPage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const summary = await getAdminSetupSummary(viewer);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="pill-label">Production onboarding</p>
        <h2 className="text-2xl font-semibold">Admin setup and operational checks</h2>
        <p className="text-sm text-muted-foreground">
          This page favors safe operational signals over pretending migration or environment verification is perfect.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Supabase"
          value={summary.supabaseStatus === "configured" ? "Configured" : "Demo preview"}
        />
        <MetricCard
          label="Migrations"
          value={summary.migrationsStatus === "ready" ? "Operational" : "Needs review"}
        />
        <MetricCard label="Current role" value={summary.currentRole} />
        <MetricCard label="Athletes" value={String(summary.athleteCount)} />
        <MetricCard label="Linked athlete accounts" value={String(summary.linkedAthleteAccountCount)} />
        <MetricCard label="Published workouts" value={String(summary.publishedWorkoutCount)} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Checks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {summary.checks.map((check) => (
            <div className="rounded-2xl bg-muted/60 p-4" key={check.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{check.label}</p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    check.status === "pass"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {check.status === "pass" ? "Pass" : "Review"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{check.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")} href="/admin">
        Back to dashboard
      </Link>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
