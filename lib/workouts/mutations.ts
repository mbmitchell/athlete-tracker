import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { AssignedWorkout, WorkoutTemplate } from "@/lib/types/domain";
import { cloneAssignedWorkoutSnapshot, createAssignedWorkoutFromTemplate } from "@/lib/workouts/snapshots";

type DbClient = SupabaseClient<Database>;

type SnapshotInsert = Omit<AssignedWorkout, "id" | "readinessEntry">;

function toNullableInteger(value: number | null | undefined): number | null {
  return value ?? null;
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function insertAssignedWorkoutSnapshot(
  supabase: DbClient,
  snapshot: SnapshotInsert,
  createdBy: string
): Promise<string> {
  const { data: workoutRow, error: workoutError } = await supabase
    .from("assigned_workouts")
    .insert({
      athlete_id: snapshot.athleteId,
      training_week_id: snapshot.trainingWeekId,
      source_template_id: snapshot.sourceTemplateId,
      workout_date: snapshot.workoutDate,
      title: snapshot.title,
      objective: snapshot.objective,
      estimated_duration_minutes: snapshot.estimatedDurationMinutes,
      status: snapshot.status,
      admin_notes: snapshot.adminNotes,
      athlete_notes: snapshot.athleteNotes,
      skip_reason: snapshot.skipReason,
      started_at: snapshot.startedAt,
      completed_at: snapshot.completedAt,
      created_by: createdBy
    })
    .select("id")
    .single();

  if (workoutError || !workoutRow) {
    throw new Error(workoutError?.message ?? "Unable to create workout.");
  }

  const sectionIds: string[] = [];

  for (const section of snapshot.sections.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const { data: sectionRow, error: sectionError } = await supabase
      .from("assigned_workout_sections")
      .insert({
        assigned_workout_id: workoutRow.id,
        title: section.title,
        description: section.description,
        sort_order: section.sortOrder
      })
      .select("id")
      .single();

    if (sectionError || !sectionRow) {
      throw new Error(sectionError?.message ?? "Unable to create workout section.");
    }

    sectionIds.push(sectionRow.id);

    const itemPayload = section.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        assigned_workout_section_id: sectionRow.id,
        source_exercise_id: item.sourceExerciseId,
        name: item.name,
        instructions: item.instructions,
        prescribed_sets: item.prescribedSets,
        prescribed_reps: item.prescribedReps,
        prescribed_load: item.prescribedLoad,
        prescribed_duration_seconds: parseOptionalInteger(item.prescribedDurationSeconds),
        prescribed_distance: item.prescribedDistance,
        prescribed_unit: item.prescribedUnit,
        target_value: item.targetValue,
        target_unit: item.targetUnit,
        rest_seconds: parseOptionalInteger(item.restSeconds),
        sort_order: item.sortOrder,
        required: item.required,
        result_entry_type: item.resultEntryType
      }));

    if (itemPayload.length > 0) {
      const { error: itemError } = await supabase.from("assigned_workout_items").insert(itemPayload);

      if (itemError) {
        throw new Error(itemError.message);
      }
    }
  }

  return workoutRow.id;
}

export async function createWorkoutFromTemplate(
  supabase: DbClient,
  template: WorkoutTemplate,
  params: {
    athleteId: string;
    trainingWeekId: string | null;
    workoutDate: string;
    createdBy: string;
  }
): Promise<string> {
  const snapshot = createAssignedWorkoutFromTemplate(template, params);
  return insertAssignedWorkoutSnapshot(supabase, snapshot, params.createdBy);
}

export async function copyAssignedWorkoutToNewTarget(
  supabase: DbClient,
  workout: AssignedWorkout,
  params: {
    athleteId: string;
    trainingWeekId: string | null;
    workoutDate: string;
    createdBy: string;
    status?: AssignedWorkout["status"];
  }
): Promise<string> {
  const snapshot = cloneAssignedWorkoutSnapshot(workout, {
    athleteId: params.athleteId,
    trainingWeekId: params.trainingWeekId,
    workoutDate: params.workoutDate,
    status: params.status ?? "draft"
  });

  return insertAssignedWorkoutSnapshot(supabase, snapshot, params.createdBy);
}

export async function duplicateTemplate(
  supabase: DbClient,
  template: WorkoutTemplate,
  ownerUserId: string
): Promise<string> {
  const { data: templateRow, error: templateError } = await supabase
    .from("workout_templates")
    .insert({
      owner_user_id: ownerUserId,
      name: `${template.name} Copy`,
      description: template.description,
      estimated_duration_minutes: toNullableInteger(template.estimatedDurationMinutes),
      focus: template.focus,
      active: template.active
    })
    .select("id")
    .single();

  if (templateError || !templateRow) {
    throw new Error(templateError?.message ?? "Unable to duplicate template.");
  }

  for (const section of template.sections.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const { data: sectionRow, error: sectionError } = await supabase
      .from("workout_template_sections")
      .insert({
        workout_template_id: templateRow.id,
        title: section.title,
        description: section.description,
        sort_order: section.sortOrder
      })
      .select("id")
      .single();

    if (sectionError || !sectionRow) {
      throw new Error(sectionError?.message ?? "Unable to duplicate template section.");
    }

    const items = section.items.map((item) => ({
      workout_template_section_id: sectionRow.id,
      exercise_id: item.exerciseId,
      custom_name: item.customName,
      instructions: item.instructions,
      prescribed_sets: item.prescribedSets,
      prescribed_reps: item.prescribedReps,
      prescribed_load: item.prescribedLoad,
      prescribed_duration_seconds: parseOptionalInteger(item.prescribedDurationSeconds),
      prescribed_distance: item.prescribedDistance,
      prescribed_unit: item.prescribedUnit,
      target_value: item.targetValue,
      target_unit: item.targetUnit,
      rest_seconds: parseOptionalInteger(item.restSeconds),
      sort_order: item.sortOrder,
      required: item.required,
      result_entry_type: item.resultEntryType,
      notes: item.notes
    }));

    if (items.length > 0) {
      const { error: itemError } = await supabase.from("workout_template_items").insert(items);

      if (itemError) {
        throw new Error(itemError.message);
      }
    }
  }

  return templateRow.id;
}
