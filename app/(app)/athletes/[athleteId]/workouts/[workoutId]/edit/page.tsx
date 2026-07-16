import { redirect } from "next/navigation";

import { WorkoutBuilder } from "@/components/planning/workout-builder";
import { getAppViewer } from "@/lib/auth/session";
import { getAthleteByIdForViewer, getAthleteSummariesForViewer } from "@/lib/data/athletes";
import { getExerciseLibraryForViewer } from "@/lib/data/library";
import { getAssignedWorkoutForBuilder } from "@/lib/data/workouts";

type WorkoutBuilderPageProps = {
  params: Promise<{ athleteId: string; workoutId: string }>;
};

export default async function WorkoutBuilderPage({ params }: WorkoutBuilderPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const { athleteId, workoutId } = await params;
  const [workout, athlete, athletes, exercises] = await Promise.all([
    getAssignedWorkoutForBuilder(viewer, athleteId, workoutId),
    getAthleteByIdForViewer(viewer, athleteId),
    getAthleteSummariesForViewer(viewer),
    getExerciseLibraryForViewer(viewer)
  ]);

  if (!workout || !athlete) {
    redirect(`/athletes/${athleteId}/weeks/2026-07-13`);
  }

  return (
    <WorkoutBuilder
      athleteName={`${athlete.firstName} ${athlete.lastName}`}
      athletes={athletes}
      exercises={exercises.filter((exercise) => exercise.active)}
      workout={workout}
    />
  );
}
