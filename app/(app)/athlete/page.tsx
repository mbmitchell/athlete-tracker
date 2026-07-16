import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, ClipboardList, Sparkles } from "lucide-react";

import { InstallHelpPanel } from "@/components/pwa/install-help-panel";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getAthletesForViewer } from "@/lib/data/athletes";
import { getAssignedWorkoutForViewerByDate } from "@/lib/data/workouts";
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
  const todayWorkout = await getAssignedWorkoutForViewerByDate(viewer, today);
  const trainingStatus = todayWorkout ? todayWorkout.status.replaceAll("_", " ") : "No workout assigned";
  const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : "Athlete";

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/95 via-primary to-sky-700 text-white">
        <CardHeader className="gap-3">
          <div className="pill-label w-fit bg-white/10 text-white">Athlete start</div>
          <CardTitle className="text-2xl text-white">
            {athleteName}
          </CardTitle>
          <p className="text-sm text-white/75">Open today’s training fast and keep your week organized like an app.</p>
        </CardHeader>
        <CardContent className="grid gap-4 text-white/90 sm:grid-cols-3">
          <DashboardMetric label="Today’s workout status" value={trainingStatus} />
          <DashboardMetric
            label="Duration"
            value={
              todayWorkout?.estimatedDurationMinutes
                ? `${todayWorkout.estimatedDurationMinutes} minutes`
                : "Training assigned soon"
            }
          />
          <DashboardMetric
            label="Focus"
            value={todayWorkout?.objective || athlete?.currentDevelopmentFocus || "Training assigned soon"}
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{todayWorkout ? "Today’s session" : "Today’s workout"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {todayWorkout ? (
              <>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="font-semibold">Session objective</p>
                  <p className="mt-2 text-muted-foreground">
                    {todayWorkout.objective ||
                      athlete?.currentDevelopmentFocus ||
                      "Your training objective will appear here once your coach adds it."}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <p className="font-semibold">Available equipment</p>
                  <p className="mt-2 text-muted-foreground">
                    {athlete?.availableEquipment.join(", ") || "No equipment profile added yet."}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-muted/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">No workout assigned today</p>
                    <p className="mt-2 text-muted-foreground">
                      Your trainer has not published a session for today yet. Check the weekly calendar or come back once the next workout is ready.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {todayWorkout ? (
              <Link className={cn(buttonVariants({ size: "lg" }), "w-full")} href={`/workouts/${today}`}>
                Open today’s workout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                A workout button will appear here as soon as a session is assigned for today.
              </div>
            )}
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")} href="/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              View weekly calendar
            </Link>
            {todayWorkout ? (
              <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")} href={`/workouts/${today}`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Review today’s details
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <InstallHelpPanel compact />
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
