import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, Settings } from "lucide-react";

import { AthleteCard } from "@/components/athletes/athlete-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAthletesForViewer, getAdminDashboardCardsForViewer } from "@/lib/data/athletes";
import { getAppViewer } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const [cards, athletes] = await Promise.all([
    getAdminDashboardCardsForViewer(viewer),
    getAthletesForViewer(viewer)
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trainer overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Managed athletes" value={String(athletes.length)} />
            <MetricCard
              label="Ready today"
              value={String(cards.filter((card) => card.latestReadinessStatus === "ready").length)}
            />
            <MetricCard
              label="Completed today"
              value={String(cards.filter((card) => card.todayCompletionStatus === "completed").length)}
            />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/60 via-white to-secondary/70">
          <CardHeader>
            <CardTitle>Next action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create or refine athlete profiles before building out weekly plans and individual training days.
            </p>
            <Link className={cn(buttonVariants({ size: "lg" }), "w-full")} href="/athletes/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add athlete
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href="/admin/setup">
              <Settings className="mr-2 h-4 w-4" />
              Open setup checks
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill-label">Athlete cards</p>
            <h2 className="mt-2 text-2xl font-semibold">Today’s roster</h2>
          </div>
        </div>
        {cards.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {cards.map((card) => (
              <AthleteCard card={card} key={card.athleteId} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No athletes are assigned yet. Start by creating your first athlete profile.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-muted/65 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
