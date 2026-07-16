import { redirect } from "next/navigation";

import { DailyWorkoutView } from "@/components/workouts/daily-workout-view";
import { Card, CardContent } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getDailyWorkoutForViewer } from "@/lib/data/workouts";

type WorkoutPageProps = {
  params: Promise<{ date: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DailyWorkoutPage({ params, searchParams }: WorkoutPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  const { date } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const athleteId =
    typeof resolvedSearchParams?.athleteId === "string" ? resolvedSearchParams.athleteId : undefined;
  const allowCompletedEdit = resolvedSearchParams?.edit === "1";
  const workout = await getDailyWorkoutForViewer(viewer, date, athleteId, allowCompletedEdit);

  if (workout) {
    return <DailyWorkoutView allowCompletedEdit={allowCompletedEdit} workout={workout} />;
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">No workout assigned yet.</p>
        <p>
          Nothing is scheduled for this athlete on {date}. Assign or publish a workout from the athlete’s weekly plan.
        </p>
      </CardContent>
    </Card>
  );
}
