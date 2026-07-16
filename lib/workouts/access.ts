import type { AppViewer, AssignedWorkout } from "@/lib/types/domain";

export function viewerCanManageAthlete(viewer: AppViewer, athleteId: string): boolean {
  return viewer.role === "admin" && viewer.connectedAthleteIds.includes(athleteId);
}

export function viewerCanViewAthlete(viewer: AppViewer, athleteId: string): boolean {
  return viewerCanManageAthlete(viewer, athleteId) || viewer.connectedAthleteIds.includes(athleteId);
}

export function viewerCanViewWorkout(viewer: AppViewer, workout: AssignedWorkout): boolean {
  if (viewerCanManageAthlete(viewer, workout.athleteId)) {
    return true;
  }

  if (!viewer.connectedAthleteIds.includes(workout.athleteId)) {
    return false;
  }

  return workout.status !== "draft";
}

export function viewerCanEditWorkoutProgress(viewer: AppViewer, workout: AssignedWorkout): boolean {
  return viewer.role === "athlete" && viewer.athleteId === workout.athleteId && workout.status !== "draft";
}

export function viewerCanRecordReadiness(viewer: AppViewer, athleteId: string): boolean {
  return viewer.role === "athlete" && viewer.athleteId === athleteId;
}
