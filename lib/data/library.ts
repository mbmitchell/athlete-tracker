import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { mockExerciseLibrary, mockWorkoutTemplates } from "@/lib/data/mock-data";
import type { AppViewer, ExerciseLibraryEntry, WorkoutTemplate } from "@/lib/types/domain";

function mapExercise(row: {
  id: string;
  name: string;
  category: ExerciseLibraryEntry["category"];
  description: string | null;
  coaching_cues: string | null;
  default_unit_type: ExerciseLibraryEntry["defaultUnitType"];
  equipment: string | null;
  video_url: string | null;
  active: boolean;
}): ExerciseLibraryEntry {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? "",
    coachingCues: row.coaching_cues ?? "",
    defaultUnitType: row.default_unit_type,
    equipment: row.equipment ?? "",
    videoUrl: row.video_url,
    active: row.active
  };
}

export const getExerciseLibraryForViewer = cache(
  async (
    viewer: AppViewer,
    filters?: { search?: string; category?: string }
  ): Promise<ExerciseLibraryEntry[]> => {
    const search = filters?.search?.trim().toLowerCase() ?? "";
    const category = filters?.category?.trim() ?? "";

    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      return mockExerciseLibrary.filter((exercise) => {
        if (category && exercise.category !== category) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [exercise.name, exercise.description, exercise.coachingCues, exercise.equipment]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
    }

    if (viewer.role !== "admin") {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("exercise_library")
      .select("id, name, category, description, coaching_cues, default_unit_type, equipment, video_url, active")
      .eq("owner_user_id", viewer.id)
      .order("name");

    if (category) {
      query = query.eq("category", category as ExerciseLibraryEntry["category"]);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,coaching_cues.ilike.%${search}%,equipment.ilike.%${search}%`
      );
    }

    const { data } = await query;
    return data?.map(mapExercise) ?? [];
  }
);

export const getWorkoutTemplatesForViewer = cache(
  async (viewer: AppViewer): Promise<WorkoutTemplate[]> => {
    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      return mockWorkoutTemplates;
    }

    if (viewer.role !== "admin") {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const [{ data: templateRows }, { data: sectionRows }, { data: itemRows }, { data: exerciseRows }] =
      await Promise.all([
        supabase
          .from("workout_templates")
          .select("id, name, description, estimated_duration_minutes, focus, active")
          .eq("owner_user_id", viewer.id)
          .order("name"),
        supabase
          .from("workout_template_sections")
          .select("id, workout_template_id, title, description, sort_order")
          .order("sort_order"),
        supabase
          .from("workout_template_items")
          .select(
            "id, workout_template_section_id, exercise_id, custom_name, instructions, prescribed_sets, prescribed_reps, prescribed_load, prescribed_duration_seconds, prescribed_distance, prescribed_unit, target_value, target_unit, rest_seconds, sort_order, required, result_entry_type, notes"
          )
          .order("sort_order"),
        supabase.from("exercise_library").select("id, name")
      ]);

    const templateIds = new Set((templateRows ?? []).map((row) => row.id));
    const exerciseNameById = new Map((exerciseRows ?? []).map((row) => [row.id, row.name]));
    const sectionsByTemplate = new Map<string, WorkoutTemplate["sections"]>();
    const itemsBySection = new Map<string, WorkoutTemplate["sections"][number]["items"]>();

    (itemRows ?? []).forEach((row) => {
      if (!itemsBySection.has(row.workout_template_section_id)) {
        itemsBySection.set(row.workout_template_section_id, []);
      }

      itemsBySection.get(row.workout_template_section_id)?.push({
        id: row.id,
        exerciseId: row.exercise_id,
        customName: row.custom_name,
        instructions: row.instructions ?? "",
        prescribedSets: row.prescribed_sets ?? "",
        prescribedReps: row.prescribed_reps ?? "",
        prescribedLoad: row.prescribed_load ?? "",
        prescribedDurationSeconds: row.prescribed_duration_seconds?.toString() ?? "",
        prescribedDistance: row.prescribed_distance ?? "",
        prescribedUnit: row.prescribed_unit ?? "",
        targetValue: row.target_value ?? "",
        targetUnit: row.target_unit ?? "",
        restSeconds: row.rest_seconds?.toString() ?? "",
        sortOrder: row.sort_order,
        required: row.required,
        resultEntryType: row.result_entry_type,
        notes: row.notes ?? "",
        exerciseName: row.exercise_id ? exerciseNameById.get(row.exercise_id) : row.custom_name ?? "Custom item"
      });
    });

    (sectionRows ?? []).forEach((row) => {
      if (!templateIds.has(row.workout_template_id)) {
        return;
      }

      if (!sectionsByTemplate.has(row.workout_template_id)) {
        sectionsByTemplate.set(row.workout_template_id, []);
      }

      sectionsByTemplate.get(row.workout_template_id)?.push({
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        sortOrder: row.sort_order,
        items: itemsBySection.get(row.id) ?? []
      });
    });

    return (templateRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      estimatedDurationMinutes: row.estimated_duration_minutes,
      focus: row.focus ?? "",
      active: row.active,
      sections: sectionsByTemplate.get(row.id) ?? []
    }));
  }
);

export const getWorkoutTemplateByIdForViewer = cache(
  async (viewer: AppViewer, templateId: string): Promise<WorkoutTemplate | null> => {
    const templates = await getWorkoutTemplatesForViewer(viewer);
    return templates.find((template) => template.id === templateId) ?? null;
  }
);
