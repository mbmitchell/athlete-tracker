import { redirect } from "next/navigation";

import { ImportPlanManager } from "@/components/planning/import-plan-manager";
import { getAppViewer } from "@/lib/auth/session";
import { getAthleteByIdForViewer } from "@/lib/data/athletes";
import { getExerciseLibraryForViewer } from "@/lib/data/library";
import { getExistingImportWorkoutsForAdmin } from "@/lib/data/workouts";
import { getWeekStartIso } from "@/lib/workouts/date";

type ImportPlanPageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ImportPlanPage({ params, searchParams }: ImportPlanPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const { athleteId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedWeekStart =
    typeof resolvedSearchParams?.weekStart === "string"
      ? resolvedSearchParams.weekStart
      : getWeekStartIso(new Date().toISOString().slice(0, 10));

  const [athlete, exercises, existingWorkouts] = await Promise.all([
    getAthleteByIdForViewer(viewer, athleteId),
    getExerciseLibraryForViewer(viewer),
    getExistingImportWorkoutsForAdmin(viewer, athleteId)
  ]);

  if (!athlete) {
    redirect("/athletes");
  }

  return (
    <ImportPlanManager
      athlete={{
        id: athlete.id,
        firstName: athlete.firstName,
        lastName: athlete.lastName
      }}
      existingWorkouts={existingWorkouts}
      exercises={exercises.filter((exercise) => exercise.active)}
      initialWeekStart={requestedWeekStart}
    />
  );
}
