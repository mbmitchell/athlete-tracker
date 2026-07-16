import Link from "next/link";

import { WorkoutProgressForm } from "@/components/workouts/workout-progress-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyWorkout } from "@/lib/types/domain";

type DailyWorkoutViewProps = {
  workout: DailyWorkout;
  allowCompletedEdit?: boolean;
};

export function DailyWorkoutView({ workout, allowCompletedEdit = false }: DailyWorkoutViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3">
          <Badge className="w-fit" variant="secondary">
            {workout.date}
          </Badge>
          <CardTitle className="text-2xl">{workout.sessionTitle}</CardTitle>
          <CardDescription>{workout.sessionObjective}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estimated duration</p>
              <p className="mt-2 font-semibold">{workout.estimatedDuration}</p>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
              <p className="mt-2 font-semibold">{workout.status.replaceAll("_", " ")}</p>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
              <p className="mt-2 font-semibold">{workout.progressPercent}%</p>
            </div>
            <div className="rounded-2xl bg-muted/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Required items</p>
              <p className="mt-2 text-sm">{workout.requiredItemsSummary}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {workout.status === "completed" && !workout.canEdit ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Completed session</p>
              <p className="text-sm text-muted-foreground">
                Results are read-only until you deliberately enter edit mode.
              </p>
            </div>
            <Link className="text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`?edit=1`}>
              Edit results
            </Link>
          </CardContent>
        </Card>
      ) : null}
      <WorkoutProgressForm allowCompletedEdit={allowCompletedEdit} workout={workout} />
    </div>
  );
}
