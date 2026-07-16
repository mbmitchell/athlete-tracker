import { describe, expect, it } from "vitest";

import { mockAssignedWorkouts, mockWorkoutTemplates } from "@/lib/data/mock-data";
import {
  viewerCanEditWorkoutProgress,
  viewerCanRecordReadiness,
  viewerCanViewAthlete,
  viewerCanViewWorkout
} from "@/lib/workouts/access";
import { calculateWorkoutProgress } from "@/lib/workouts/progress";
import { cloneAssignedWorkoutSnapshot, createAssignedWorkoutFromTemplate } from "@/lib/workouts/snapshots";
import { canUnpublishWeek, getWorkoutStatusAfterSave } from "@/lib/workouts/status";
import type { AppViewer } from "@/lib/types/domain";

const adminViewer: AppViewer = {
  id: "admin-1",
  email: "coach@example.com",
  displayName: "Coach",
  role: "admin",
  mode: "authenticated",
  athleteId: null,
  connectedAthleteIds: ["athlete-colt", "athlete-lane"],
  accessState: "active"
};

const athleteViewer: AppViewer = {
  id: "athlete-user-1",
  email: "colt@example.com",
  displayName: "Colt",
  role: "athlete",
  mode: "authenticated",
  athleteId: "athlete-colt",
  connectedAthleteIds: ["athlete-colt"],
  accessState: "active"
};

const parentViewer: AppViewer = {
  id: "parent-1",
  email: "parent@example.com",
  displayName: "Parent",
  role: "parent",
  mode: "authenticated",
  athleteId: null,
  connectedAthleteIds: ["athlete-colt"],
  accessState: "active"
};

describe("workout access", () => {
  it("enforces role-based athlete visibility", () => {
    expect(viewerCanViewAthlete(adminViewer, "athlete-colt")).toBe(true);
    expect(viewerCanViewAthlete(parentViewer, "athlete-colt")).toBe(true);
    expect(viewerCanViewAthlete(parentViewer, "athlete-lane")).toBe(false);
  });

  it("prevents athletes from seeing another athlete's workout", () => {
    const laneWorkout = mockAssignedWorkouts.find((workout) => workout.athleteId === "athlete-lane")!;
    expect(viewerCanViewWorkout(athleteViewer, laneWorkout)).toBe(false);
  });

  it("allows only the owning athlete to edit workout progress and readiness", () => {
    const coltWorkout = mockAssignedWorkouts.find((workout) => workout.athleteId === "athlete-colt")!;
    expect(viewerCanEditWorkoutProgress(athleteViewer, coltWorkout)).toBe(true);
    expect(viewerCanEditWorkoutProgress(parentViewer, coltWorkout)).toBe(false);
    expect(viewerCanRecordReadiness(athleteViewer, "athlete-colt")).toBe(true);
    expect(viewerCanRecordReadiness(athleteViewer, "athlete-lane")).toBe(false);
  });
});

describe("snapshot behavior", () => {
  it("creates independent workout copies", () => {
    const sourceWorkout = mockAssignedWorkouts[0];
    const clone = cloneAssignedWorkoutSnapshot(sourceWorkout, {
      athleteId: "athlete-lane",
      trainingWeekId: "week-lane-2026-07-13",
      workoutDate: "2026-07-20",
      status: "draft"
    });

    clone.sections[0].items[0].instructions = "Changed";

    expect(sourceWorkout.sections[0].items[0].instructions).not.toBe("Changed");
    expect(clone.sections[0].items[0].result).toBeNull();
  });

  it("keeps assigned snapshots stable even if a template changes later", () => {
    const template = structuredClone(mockWorkoutTemplates[0]);
    const snapshot = createAssignedWorkoutFromTemplate(template, {
      athleteId: "athlete-colt",
      trainingWeekId: "week-colt-2026-07-13",
      workoutDate: "2026-07-21",
      createdBy: "admin-1"
    });

    template.sections[0].items[0].instructions = "Updated template instruction";

    expect(snapshot.sections[0].items[0].instructions).not.toBe("Updated template instruction");
  });
});

describe("workout progress and status", () => {
  it("distinguishes required completion from optional items", () => {
    const workout = structuredClone(mockAssignedWorkouts.find((entry) => entry.id === "workout-colt-2026-07-16")!);
    workout.sections[0].items[2].required = false;
    const summary = calculateWorkoutProgress(workout.sections.flatMap((section) => section.items));

    expect(summary.completedRequired).toBe(2);
    expect(summary.totalRequired).toBe(2);
    expect(summary.requiredComplete).toBe(true);
    expect(summary.totalOptional).toBe(1);
  });

  it("advances status from published to in-progress and then completed", () => {
    expect(
      getWorkoutStatusAfterSave("published", {
        hasTouchedResults: true,
        markComplete: false,
        markSkipped: false
      })
    ).toBe("in_progress");

    expect(
      getWorkoutStatusAfterSave("in_progress", {
        hasTouchedResults: true,
        markComplete: true,
        markSkipped: false
      })
    ).toBe("completed");
  });

  it("blocks unpublishing a week after athlete progress exists", () => {
    expect(
      canUnpublishWeek([
        {
          id: "1",
          athleteId: "athlete-colt",
          workoutDate: "2026-07-14",
          title: "Completed",
          objective: "",
          estimatedDurationMinutes: 60,
          status: "completed",
          sourceTemplateId: null
        }
      ])
    ).toBe(false);
  });
});
