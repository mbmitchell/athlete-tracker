import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getAthletesForViewer } from "@/lib/data/athletes";
import { cn } from "@/lib/utils";

export default async function AthleteDashboardPage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role === "admin") {
    redirect("/admin");
  }

  const athletes = await getAthletesForViewer(viewer);
  const athlete = athletes[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/95 via-primary to-sky-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            {athlete ? `${athlete.firstName} ${athlete.lastName}` : "Athlete Dashboard"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-white/90 sm:grid-cols-3">
          <DashboardMetric label="Today" value="Explosive lower body" />
          <DashboardMetric label="Duration" value="65 minutes" />
          <DashboardMetric label="Focus" value={athlete?.currentDevelopmentFocus || "Training assigned soon"} />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="font-semibold">Primary objective</p>
              <p className="mt-2 text-muted-foreground">
                {athlete?.currentDevelopmentFocus || "Assigned weekly focus will appear here once a training block is created."}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <p className="font-semibold">Available equipment</p>
              <p className="mt-2 text-muted-foreground">
                {athlete?.availableEquipment.join(", ") || "No equipment profile added yet."}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link className={cn(buttonVariants({ size: "lg" }), "w-full")} href={`/workouts/${today}`}>
              Open today’s workout
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")} href="/calendar">
              View weekly calendar
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{label}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}
