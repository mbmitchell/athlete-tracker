import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getWeeklyCalendarDaysForViewer } from "@/lib/data/workouts";

const statusVariant = {
  draft: "outline",
  published: "secondary",
  completed: "success",
  in_progress: "warning",
  skipped: "destructive",
  not_assigned: "outline"
} as const;

type WeeklyCalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WeeklyCalendarPage({ searchParams }: WeeklyCalendarPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedAthleteId =
    typeof resolvedSearchParams?.athleteId === "string" ? resolvedSearchParams.athleteId : undefined;
  const calendar = await getWeeklyCalendarDaysForViewer(
    viewer,
    new Date().toISOString().slice(0, 10),
    selectedAthleteId
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="pill-label">Weekly calendar</p>
        <h2 className="mt-2 text-2xl font-semibold">Plan the week, then execute each day.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {calendar
            ? `${calendar.athleteName} · week of ${calendar.weekStart}`
            : "No athlete schedule is available for this account yet."}
        </p>
      </section>

      {calendar && calendar.days.length > 0 ? (
        <div className="grid gap-4">
          {calendar.days.map((day) => (
            <a href={day.href} key={day.date}>
              <Card className="transition-transform hover:-translate-y-0.5">
                <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg">
                    {day.label} · {day.date}
                  </CardTitle>
                  <Badge variant={statusVariant[day.status]}>{day.status.replaceAll("_", " ")}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{day.focus}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No weekly plan has been assigned yet. Admin-created workouts will populate this calendar once they are scheduled.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
