import type { AssignedWorkoutStatus, WorkoutSummary } from "@/lib/types/domain";

type StatusTransitionOptions = {
  hasTouchedResults: boolean;
  markComplete: boolean;
  markSkipped: boolean;
};

export function getWorkoutStatusAfterSave(
  currentStatus: AssignedWorkoutStatus,
  options: StatusTransitionOptions
): AssignedWorkoutStatus {
  if (options.markSkipped) {
    return "skipped";
  }

  if (options.markComplete) {
    return "completed";
  }

  if (currentStatus === "published" && options.hasTouchedResults) {
    return "in_progress";
  }

  if (currentStatus === "completed" || currentStatus === "skipped") {
    return currentStatus;
  }

  return currentStatus;
}

export function canUnpublishWeek(workouts: WorkoutSummary[]): boolean {
  return workouts.every((workout) => workout.status === "draft" || workout.status === "published");
}

export function isWorkoutVisibleToAthlete(status: AssignedWorkoutStatus): boolean {
  return status !== "draft";
}
