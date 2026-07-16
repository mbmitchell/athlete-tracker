import type {
  AssignedWorkout,
  AssignedWorkoutItem,
  AssignedWorkoutSection,
  ExerciseLibraryEntry,
  WorkoutTemplate
} from "@/lib/types/domain";

type SnapshotContext = {
  athleteId: string;
  trainingWeekId: string | null;
  workoutDate: string;
  createdBy: string;
};

function makeSectionId(sourceId: string, index: number): string {
  return `${sourceId}-section-${index + 1}`;
}

function makeItemId(sourceId: string, index: number): string {
  return `${sourceId}-item-${index + 1}`;
}

export function createAssignedWorkoutFromTemplate(
  template: WorkoutTemplate,
  context: SnapshotContext
): Omit<AssignedWorkout, "id" | "readinessEntry"> {
  const sections: AssignedWorkoutSection[] = template.sections.map((section, sectionIndex) => ({
    id: makeSectionId(section.id, sectionIndex),
    title: section.title,
    description: section.description,
    sortOrder: section.sortOrder,
    items: section.items.map((item, itemIndex) => ({
      id: makeItemId(item.id, itemIndex),
      sourceExerciseId: item.exerciseId,
      name: item.exerciseName ?? item.customName ?? "Custom item",
      instructions: item.instructions,
      prescribedSets: item.prescribedSets,
      prescribedReps: item.prescribedReps,
      prescribedLoad: item.prescribedLoad,
      prescribedDurationSeconds: item.prescribedDurationSeconds,
      prescribedDistance: item.prescribedDistance,
      prescribedUnit: item.prescribedUnit,
      targetValue: item.targetValue,
      targetUnit: item.targetUnit,
      restSeconds: item.restSeconds,
      sortOrder: item.sortOrder,
      required: item.required,
      resultEntryType: item.resultEntryType,
      result: null
    }))
  }));

  return {
    athleteId: context.athleteId,
    trainingWeekId: context.trainingWeekId,
    sourceTemplateId: template.id,
    workoutDate: context.workoutDate,
    title: template.name,
    objective: template.description || template.focus,
    estimatedDurationMinutes: template.estimatedDurationMinutes,
    status: "draft",
    adminNotes: "",
    athleteNotes: "",
    skipReason: "",
    startedAt: null,
    completedAt: null,
    sections
  };
}

export function cloneAssignedWorkoutSnapshot(
  workout: AssignedWorkout,
  overrides: Partial<Pick<AssignedWorkout, "athleteId" | "workoutDate" | "trainingWeekId" | "status">>
): Omit<AssignedWorkout, "id" | "readinessEntry"> {
  return {
    athleteId: overrides.athleteId ?? workout.athleteId,
    trainingWeekId: overrides.trainingWeekId ?? workout.trainingWeekId,
    sourceTemplateId: workout.sourceTemplateId,
    workoutDate: overrides.workoutDate ?? workout.workoutDate,
    title: workout.title,
    objective: workout.objective,
    estimatedDurationMinutes: workout.estimatedDurationMinutes,
    status: overrides.status ?? "draft",
    adminNotes: workout.adminNotes,
    athleteNotes: "",
    skipReason: "",
    startedAt: null,
    completedAt: null,
    sections: workout.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        result: null
      }))
    }))
  };
}

export function createCustomWorkoutItem(
  name: string,
  resultEntryType: AssignedWorkoutItem["resultEntryType"],
  exercise?: ExerciseLibraryEntry
): Pick<AssignedWorkoutItem, "sourceExerciseId" | "name" | "instructions" | "resultEntryType"> {
  return {
    sourceExerciseId: exercise?.id ?? null,
    name: exercise?.name ?? name,
    instructions: exercise?.coachingCues ?? "",
    resultEntryType: exercise?.defaultUnitType ?? resultEntryType
  };
}
