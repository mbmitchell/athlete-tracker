import type { ExerciseLibraryEntry, WorkoutResultType } from "@/lib/types/domain";

import type {
  ExistingImportWorkout,
  ImportConflict,
  ImportItemType,
  ImportPreviewDay,
  ImportPreviewItem,
  ImportPreviewPlan,
  ParsedPlan
} from "@/lib/import-plan/types";

function normalizeExerciseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapImportTypeToResultEntryType(itemType: ImportItemType): WorkoutResultType {
  switch (itemType) {
    case "checkbox":
      return "checkbox";
    case "readiness":
      return "rating";
    case "sets_reps":
      return "sets_reps";
    case "sets_reps_weight":
      return "sets_reps_weight";
    case "duration":
      return "duration";
    case "distance":
      return "distance";
    case "velocity":
      return "velocity";
    case "numeric":
      return "numeric";
    case "rating":
      return "rating";
    case "nutrition":
    case "text":
    default:
      return "text";
  }
}

export function matchExerciseByName(
  itemName: string,
  exercises: ExerciseLibraryEntry[]
): ExerciseLibraryEntry | null {
  const exact = exercises.find((exercise) => exercise.name.toLowerCase() === itemName.trim().toLowerCase());

  if (exact) {
    return exact;
  }

  const normalizedName = normalizeExerciseName(itemName);
  return (
    exercises.find((exercise) => normalizeExerciseName(exercise.name) === normalizedName) ?? null
  );
}

export function buildImportPreviewPlan(params: {
  athleteId: string;
  athleteName: string;
  fallbackWeekStart: string;
  parsedPlan: ParsedPlan;
  exercises: ExerciseLibraryEntry[];
}): ImportPreviewPlan {
  return {
    athleteId: params.athleteId,
    athleteName: params.athleteName,
    weekStart: params.parsedPlan.weekStart ?? params.fallbackWeekStart,
    weeklyFocus: params.parsedPlan.weeklyFocus ?? "",
    warnings: params.parsedPlan.warnings,
    errors: params.parsedPlan.errors,
    days: params.parsedPlan.days.map((day, dayIndex): ImportPreviewDay => ({
      id: day.id || `preview-day-${dayIndex + 1}`,
      lineNumber: day.lineNumber,
      date: day.date ?? "",
      title: day.title ?? `Workout ${dayIndex + 1}`,
      objective: day.objective ?? "",
      estimatedMinutes: day.estimatedMinutes ?? null,
      sections: day.sections.map((section, sectionIndex) => ({
        id: section.id || `${day.id}-section-${sectionIndex + 1}`,
        lineNumber: section.lineNumber,
        title: section.title ?? `Section ${sectionIndex + 1}`,
        items: section.items.map((item, itemIndex): ImportPreviewItem => {
          const matchedExercise = item.name ? matchExerciseByName(item.name, params.exercises) : null;
          const type = item.type ?? "text";
          const recordType = item.record && item.record !== "nutrition" ? item.record : null;

          return {
            id: item.id || `${section.id}-item-${itemIndex + 1}`,
            lineNumber: item.lineNumber,
            name: matchedExercise?.name ?? item.name ?? `Custom activity ${itemIndex + 1}`,
            type,
            resultEntryType: recordType
              ? mapImportTypeToResultEntryType(recordType)
              : matchedExercise?.defaultUnitType ?? mapImportTypeToResultEntryType(type),
            matchedExerciseId: matchedExercise?.id ?? null,
            matchedExerciseName: matchedExercise?.name ?? null,
            matchStatus: matchedExercise ? "matched" : "custom",
            instructions: item.instructions ?? matchedExercise?.coachingCues ?? "",
            sets: item.sets ?? "",
            reps: item.reps ?? "",
            load: item.load ?? "",
            duration: item.duration ?? "",
            distance: item.distance ?? "",
            target: item.target ?? "",
            unit: item.unit ?? "",
            rest: item.rest ?? "",
            required: item.required ?? true
          };
        })
      }))
    }))
  };
}

export function resolveImportConflicts(params: {
  days: Pick<ImportPreviewDay, "date">[];
  existingWorkouts: ExistingImportWorkout[];
}): ImportConflict[] {
  const workoutByDate = new Map(params.existingWorkouts.map((workout) => [workout.workoutDate, workout]));

  return params.days.flatMap((day) => {
    const existing = workoutByDate.get(day.date);

    if (!existing) {
      return [];
    }

    const isBlocked = existing.status === "completed" || existing.status === "in_progress" || existing.hasResults;
    const blockingReason = existing.hasResults
      ? "This day already contains saved athlete results."
      : existing.status === "draft"
        ? null
        : "Only draft workouts without athlete progress can be replaced.";

    return [
      {
        date: day.date,
        existingWorkoutId: existing.id,
        title: existing.title,
        status: existing.status,
        hasResults: existing.hasResults,
        allowCreateMissingDays: false,
        allowReplaceDraft: existing.status === "draft" && !existing.hasResults,
        blockingReason: isBlocked ? blockingReason : blockingReason
      }
    ];
  });
}
