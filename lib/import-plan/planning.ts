import type { AssignedWorkout } from "@/lib/types/domain";

import type {
  ImportConflict,
  ImportPreviewDay,
  ImportPreviewPlan
} from "@/lib/import-plan/types";

export type ImportSaveStrategy = "create_missing_days_only" | "replace_selected_drafts";

export type ImportExecutionPlan = {
  createDays: ImportPreviewDay[];
  replaceDays: Array<{ day: ImportPreviewDay; existingWorkoutId: string }>;
  skippedDays: Array<{ day: ImportPreviewDay; reason: string }>;
  blockingErrors: string[];
};

export type ImportWorkoutSnapshot = Omit<AssignedWorkout, "id" | "readinessEntry">;

function getWeekDates(weekStart: string) {
  const dates: string[] = [];
  const cursor = new Date(`${weekStart}T00:00:00Z`);

  for (let index = 0; index < 7; index += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return new Set(dates);
}

export function validateImportPreviewPlanForWeek(
  plan: Pick<ImportPreviewPlan, "days">,
  weekStart: string
) {
  const errors: string[] = [];
  const validDates = getWeekDates(weekStart);
  const seenDates = new Set<string>();

  if (plan.days.length === 0) {
    errors.push("Add at least one imported day before saving.");
  }

  for (const day of plan.days) {
    if (!day.date) {
      errors.push("Each imported day needs a valid date.");
      continue;
    }

    if (!validDates.has(day.date)) {
      errors.push(`Imported day ${day.date} is outside the selected week starting ${weekStart}.`);
    }

    if (seenDates.has(day.date)) {
      errors.push(`Imported day ${day.date} appears more than once.`);
    }

    seenDates.add(day.date);

    if (!day.title.trim()) {
      errors.push(`Imported day ${day.date} needs a session title.`);
    }

    if (day.sections.length === 0) {
      errors.push(`Imported day ${day.date} needs at least one workout section.`);
    }

    for (const section of day.sections) {
      if (!section.title.trim()) {
        errors.push(`Imported day ${day.date} contains a section without a title.`);
      }

      if (section.items.length === 0) {
        errors.push(`Section "${section.title || "Untitled section"}" on ${day.date} needs at least one item.`);
      }

      for (const item of section.items) {
        if (!item.name.trim()) {
          errors.push(`A workout item on ${day.date} is missing a name.`);
        }
      }
    }
  }

  return Array.from(new Set(errors));
}

export function buildImportExecutionPlan(params: {
  days: ImportPreviewDay[];
  conflicts: ImportConflict[];
  strategy: ImportSaveStrategy;
  replaceWorkoutIds: string[];
}): ImportExecutionPlan {
  const conflictByDate = new Map(params.conflicts.map((conflict) => [conflict.date, conflict]));
  const replaceIds = new Set(params.replaceWorkoutIds);
  const createDays: ImportPreviewDay[] = [];
  const replaceDays: Array<{ day: ImportPreviewDay; existingWorkoutId: string }> = [];
  const skippedDays: Array<{ day: ImportPreviewDay; reason: string }> = [];
  const blockingErrors: string[] = [];

  for (const day of params.days) {
    const conflict = conflictByDate.get(day.date);

    if (!conflict) {
      createDays.push(day);
      continue;
    }

    if (conflict.blockingReason && !conflict.allowReplaceDraft) {
      skippedDays.push({ day, reason: conflict.blockingReason });
      continue;
    }

    if (params.strategy === "replace_selected_drafts") {
      if (replaceIds.has(conflict.existingWorkoutId)) {
        if (!conflict.allowReplaceDraft) {
          blockingErrors.push(
            `Workout ${conflict.title} on ${conflict.date} cannot be replaced because it is not a draft without results.`
          );
          continue;
        }

        replaceDays.push({ day, existingWorkoutId: conflict.existingWorkoutId });
        continue;
      }

      skippedDays.push({
        day,
        reason: conflict.allowReplaceDraft
          ? "An existing draft workout was left in place."
          : conflict.blockingReason ?? "An existing workout already occupies this day."
      });
      continue;
    }

    skippedDays.push({
      day,
      reason: conflict.blockingReason ?? "An existing workout already occupies this day."
    });
  }

  if (createDays.length === 0 && replaceDays.length === 0) {
    blockingErrors.push("No importable days remain after conflict handling.");
  }

  return {
    createDays,
    replaceDays,
    skippedDays,
    blockingErrors: Array.from(new Set(blockingErrors))
  };
}

export function buildAssignedWorkoutSnapshotFromImportDay(params: {
  athleteId: string;
  trainingWeekId: string;
  day: ImportPreviewDay;
}): ImportWorkoutSnapshot {
  return {
    athleteId: params.athleteId,
    trainingWeekId: params.trainingWeekId,
    sourceTemplateId: null,
    workoutDate: params.day.date,
    title: params.day.title.trim(),
    objective: params.day.objective.trim(),
    estimatedDurationMinutes: params.day.estimatedMinutes,
    status: "draft" as const,
    adminNotes: "",
    athleteNotes: "",
    skipReason: "",
    startedAt: null,
    completedAt: null,
    sections: params.day.sections.map((section, sectionIndex) => ({
      id: `${params.day.id}-section-snapshot-${sectionIndex + 1}`,
      title: section.title.trim(),
      description: "",
      sortOrder: sectionIndex + 1,
      items: section.items.map((item, itemIndex) => ({
        id: `${section.id}-item-snapshot-${itemIndex + 1}`,
        sourceExerciseId: item.matchedExerciseId,
        name: item.name.trim(),
        instructions: item.instructions.trim(),
        prescribedSets: item.sets.trim(),
        prescribedReps: item.reps.trim(),
        prescribedLoad: item.load.trim(),
        prescribedDurationSeconds: item.duration.trim(),
        prescribedDistance: item.distance.trim(),
        prescribedUnit: item.unit.trim(),
        targetValue: item.target.trim(),
        targetUnit: "",
        restSeconds: item.rest.trim(),
        sortOrder: itemIndex + 1,
        required: item.required,
        resultEntryType: item.resultEntryType,
        result: null
      }))
    })),
  };
}

export function stripAssignedWorkoutIdentity(workout: AssignedWorkout): ImportWorkoutSnapshot {
  return {
    athleteId: workout.athleteId,
    trainingWeekId: workout.trainingWeekId,
    sourceTemplateId: workout.sourceTemplateId,
    workoutDate: workout.workoutDate,
    title: workout.title,
    objective: workout.objective,
    estimatedDurationMinutes: workout.estimatedDurationMinutes,
    status: workout.status,
    adminNotes: workout.adminNotes,
    athleteNotes: workout.athleteNotes,
    skipReason: workout.skipReason,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    sections: workout.sections
  };
}
