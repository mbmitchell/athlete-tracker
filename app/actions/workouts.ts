"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAppViewer } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { getAssignedWorkoutForBuilder, getDailyWorkoutForViewer, getTrainingWeekForAdmin } from "@/lib/data/workouts";
import { getWorkoutTemplateByIdForViewer } from "@/lib/data/library";
import { assignedWorkoutSchema, trainingWeekSchema, workoutItemSchema, workoutSectionSchema } from "@/lib/validation/workouts";
import { calculateWorkoutProgress } from "@/lib/workouts/progress";
import { canUnpublishWeek, getWorkoutStatusAfterSave } from "@/lib/workouts/status";
import {
  copyAssignedWorkoutToNewTarget,
  createWorkoutFromTemplate,
  insertAssignedWorkoutSnapshot
} from "@/lib/workouts/mutations";
import { buildWeekDates, formatIsoDate, getWeekStartIso } from "@/lib/workouts/date";
import type { AssignedWorkout, TrainingWeekDetail } from "@/lib/types/domain";

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function redirectWithStatus(path: string, search: string): never {
  redirect(`${path}?${search}`);
}

async function assertAdmin() {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "admin") {
    redirect("/login");
  }

  return viewer;
}

async function ensureTrainingWeek(
  athleteId: string,
  weekStart: string,
  viewerId: string,
  draft?: Partial<Pick<TrainingWeekDetail, "title" | "focus" | "adminNotes">>
) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("training_weeks")
    .select("id, title, focus, admin_notes")
    .eq("athlete_id", athleteId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("training_weeks")
    .insert({
      athlete_id: athleteId,
      week_start_date: weekStart,
      title: draft?.title ?? `Week of ${weekStart}`,
      focus: draft?.focus ?? "",
      admin_notes: draft?.adminNotes ?? "",
      created_by: viewerId,
      status: "draft"
    })
    .select("id, title, focus, admin_notes")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create training week.");
  }

  return data;
}

async function loadManagedWorkoutOrThrow(viewerId: string, athleteId: string, workoutId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assigned_workouts")
    .select("id, athlete_id, training_week_id, workout_date, status")
    .eq("id", workoutId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Workout not found.");
  }

  return data;
}

async function copyWorkoutSnapshotToWeek(
  workout: AssignedWorkout,
  targetAthleteId: string,
  targetWeekId: string,
  targetDate: string,
  createdBy: string
) {
  const supabase = await createSupabaseServerClient();
  return copyAssignedWorkoutToNewTarget(supabase, workout, {
    athleteId: targetAthleteId,
    trainingWeekId: targetWeekId,
    workoutDate: targetDate,
    createdBy,
    status: "draft"
  });
}

export async function manageWeekPlanAction(formData: FormData) {
  const viewer = await assertAdmin();
  const intent = String(formData.get("intent") ?? "");
  const athleteId = String(formData.get("athleteId") ?? "");
  const weekStart = String(formData.get("weekStart") ?? "");
  const weekPath = `/athletes/${athleteId}/weeks/${weekStart}`;

  if (!getSupabaseConfig()) {
    redirectWithStatus(weekPath, "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();

  try {
    if (intent === "update_week") {
      const parsed = trainingWeekSchema.safeParse({
        weekId: formData.get("weekId"),
        athleteId,
        weekStart,
        title: formData.get("title"),
        focus: formData.get("focus"),
        adminNotes: formData.get("adminNotes")
      });

      if (!parsed.success) {
        redirectWithStatus(weekPath, "error=invalid_week");
      }
      const data = parsed.data;

      const week = await ensureTrainingWeek(athleteId, weekStart, viewer.id, {
        title: data.title,
        focus: data.focus,
        adminNotes: data.adminNotes
      });

      const { error } = await supabase
        .from("training_weeks")
        .update({
          title: data.title,
          focus: data.focus,
          admin_notes: data.adminNotes
        })
        .eq("id", week.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "create_blank_workout") {
      const workoutDate = String(formData.get("workoutDate") ?? "");
      const week = await ensureTrainingWeek(athleteId, weekStart, viewer.id);

      await insertAssignedWorkoutSnapshot(
        supabase,
        {
          athleteId,
          trainingWeekId: week.id,
          sourceTemplateId: null,
          workoutDate,
          title: "New workout",
          objective: "",
          estimatedDurationMinutes: 60,
          status: "draft",
          adminNotes: "",
          athleteNotes: "",
          skipReason: "",
          startedAt: null,
          completedAt: null,
          sections: []
        },
        viewer.id
      );
    }

    if (intent === "create_from_template") {
      const workoutDate = String(formData.get("workoutDate") ?? "");
      const templateId = String(formData.get("templateId") ?? "");
      const week = await ensureTrainingWeek(athleteId, weekStart, viewer.id);
      const template = await getWorkoutTemplateByIdForViewer(viewer, templateId);

      if (!template) {
        throw new Error("Template not found.");
      }

      await createWorkoutFromTemplate(supabase, template, {
        athleteId,
        trainingWeekId: week.id,
        workoutDate,
        createdBy: viewer.id
      });
    }

    if (intent === "publish_week") {
      const week = await ensureTrainingWeek(athleteId, weekStart, viewer.id);

      const { error: weekError } = await supabase
        .from("training_weeks")
        .update({ status: "published" })
        .eq("id", week.id);

      if (weekError) {
        throw new Error(weekError.message);
      }

      const { error: workoutError } = await supabase
        .from("assigned_workouts")
        .update({ status: "published" })
        .eq("training_week_id", week.id)
        .eq("status", "draft");

      if (workoutError) {
        throw new Error(workoutError.message);
      }
    }

    if (intent === "unpublish_week") {
      const week = await getTrainingWeekForAdmin(viewer, athleteId, weekStart);

      if (!week?.id) {
        throw new Error("Week not found.");
      }

      if (!canUnpublishWeek(week.workouts)) {
        redirectWithStatus(weekPath, "error=week_has_results");
      }

      const { error: weekError } = await supabase
        .from("training_weeks")
        .update({ status: "draft" })
        .eq("id", week.id);

      if (weekError) {
        throw new Error(weekError.message);
      }

      const { error: workoutError } = await supabase
        .from("assigned_workouts")
        .update({ status: "draft" })
        .eq("training_week_id", week.id)
        .eq("status", "published");

      if (workoutError) {
        throw new Error(workoutError.message);
      }
    }

    if (intent === "delete_workout") {
      const workoutId = String(formData.get("workoutId") ?? "");
      const workout = await loadManagedWorkoutOrThrow(viewer.id, athleteId, workoutId);

      if (workout.status !== "draft") {
        redirectWithStatus(weekPath, "error=delete_only_drafts");
      }

      const { error } = await supabase.from("assigned_workouts").delete().eq("id", workoutId);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "copy_prior_week") {
      const currentWeek = await ensureTrainingWeek(athleteId, weekStart, viewer.id);
      const { data: previousWeek } = await supabase
        .from("training_weeks")
        .select("id, week_start_date")
        .eq("athlete_id", athleteId)
        .lt("week_start_date", weekStart)
        .order("week_start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!previousWeek) {
        redirectWithStatus(weekPath, "error=no_prior_week");
      }

      const previousWeekStart = previousWeek!.week_start_date;
      const sourceDates = buildWeekDates(previousWeekStart);
      const targetDates = buildWeekDates(weekStart);
      const sourceWorkouts = await Promise.all(
        sourceDates.map(async (date) => getDailyWorkoutForViewer({ ...viewer, athleteId, connectedAthleteIds: [athleteId] }, date, athleteId))
      );

      for (let index = 0; index < sourceWorkouts.length; index += 1) {
        const source = sourceWorkouts[index];

        if (!source) {
          continue;
        }

        const fullWorkout = await getAssignedWorkoutForBuilder(viewer, athleteId, source.id);

        if (!fullWorkout) {
          continue;
        }

        await copyWorkoutSnapshotToWeek(fullWorkout, athleteId, currentWeek.id, targetDates[index], viewer.id);
      }
    }
  } catch {
    redirectWithStatus(weekPath, "error=action_failed");
  }

  revalidatePath(weekPath);
  revalidatePath("/calendar");
  revalidatePath("/admin");
  redirectWithStatus(weekPath, "status=saved");
}

export async function manageWorkoutBuilderAction(formData: FormData) {
  const viewer = await assertAdmin();
  const intent = String(formData.get("intent") ?? "");
  const athleteId = String(formData.get("athleteId") ?? "");
  const workoutId = String(formData.get("workoutId") ?? "");
  const workoutPath = `/athletes/${athleteId}/workouts/${workoutId}/edit`;

  if (!getSupabaseConfig()) {
    redirectWithStatus(workoutPath, "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();

  try {
    if (intent === "update_workout_header") {
      const parsed = assignedWorkoutSchema.safeParse({
        workoutId,
        athleteId,
        trainingWeekId: formData.get("trainingWeekId"),
        workoutDate: formData.get("workoutDate"),
        title: formData.get("title"),
        objective: formData.get("objective"),
        estimatedDurationMinutes: formData.get("estimatedDurationMinutes"),
        adminNotes: formData.get("adminNotes"),
        skipReason: formData.get("skipReason")
      });

      if (!parsed.success) {
        redirectWithStatus(workoutPath, "error=invalid_workout");
      }
      const data = parsed.data;

      const nextStatus = String(formData.get("status") ?? "draft") as AssignedWorkout["status"];
      const { error } = await supabase
        .from("assigned_workouts")
        .update({
          workout_date: data.workoutDate,
          title: data.title,
          objective: data.objective,
          estimated_duration_minutes: data.estimatedDurationMinutes,
          admin_notes: data.adminNotes,
          skip_reason: data.skipReason,
          status: nextStatus
        })
        .eq("id", workoutId)
        .eq("athlete_id", athleteId);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "add_section") {
      const parsed = workoutSectionSchema.safeParse({
        workoutId,
        title: formData.get("title"),
        description: formData.get("description")
      });

      if (!parsed.success) {
        redirectWithStatus(workoutPath, "error=invalid_section");
      }
      const data = parsed.data;

      const { data: sections } = await supabase
        .from("assigned_workout_sections")
        .select("sort_order")
        .eq("assigned_workout_id", workoutId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (sections?.[0]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("assigned_workout_sections").insert({
        assigned_workout_id: workoutId,
        title: data.title,
        description: data.description,
        sort_order: nextOrder
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "update_section") {
      const sectionId = String(formData.get("sectionId") ?? "");
      const parsed = workoutSectionSchema.safeParse({
        sectionId,
        workoutId,
        title: formData.get("title"),
        description: formData.get("description")
      });

      if (!parsed.success) {
        redirectWithStatus(workoutPath, "error=invalid_section");
      }
      const data = parsed.data;

      const { error } = await supabase
        .from("assigned_workout_sections")
        .update({
          title: data.title,
          description: data.description
        })
        .eq("id", sectionId);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "move_section") {
      const sectionId = String(formData.get("sectionId") ?? "");
      const direction = String(formData.get("direction") ?? "up");
      const { data: sections } = await supabase
        .from("assigned_workout_sections")
        .select("id, sort_order")
        .eq("assigned_workout_id", workoutId)
        .order("sort_order");

      const currentIndex = (sections ?? []).findIndex((section) => section.id === sectionId);

      if (currentIndex >= 0) {
        const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (sections && sections[swapIndex]) {
          const current = sections[currentIndex];
          const swap = sections[swapIndex];

          await supabase.from("assigned_workout_sections").update({ sort_order: swap.sort_order }).eq("id", current.id);
          await supabase.from("assigned_workout_sections").update({ sort_order: current.sort_order }).eq("id", swap.id);
        }
      }
    }

    if (intent === "delete_section") {
      const sectionId = String(formData.get("sectionId") ?? "");
      await supabase.from("assigned_workout_sections").delete().eq("id", sectionId);
    }

    if (intent === "add_item") {
      const sectionId = String(formData.get("sectionId") ?? "");
      const parsed = workoutItemSchema.safeParse({
        sectionId,
        exerciseId: formData.get("exerciseId"),
        customName: formData.get("customName"),
        instructions: formData.get("instructions"),
        prescribedSets: formData.get("prescribedSets"),
        prescribedReps: formData.get("prescribedReps"),
        prescribedLoad: formData.get("prescribedLoad"),
        prescribedDurationSeconds: formData.get("prescribedDurationSeconds"),
        prescribedDistance: formData.get("prescribedDistance"),
        prescribedUnit: formData.get("prescribedUnit"),
        targetValue: formData.get("targetValue"),
        targetUnit: formData.get("targetUnit"),
        restSeconds: formData.get("restSeconds"),
        required: formData.get("required") ?? "true",
        resultEntryType: formData.get("resultEntryType")
      });

      if (!parsed.success) {
        redirectWithStatus(workoutPath, "error=invalid_item");
      }
      const data = parsed.data;

      const { data: exercise } = data.exerciseId
        ? await supabase
            .from("exercise_library")
            .select("name, coaching_cues, default_unit_type")
            .eq("id", data.exerciseId)
            .maybeSingle()
        : { data: null };

      const { data: items } = await supabase
        .from("assigned_workout_items")
        .select("sort_order")
        .eq("assigned_workout_section_id", sectionId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (items?.[0]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("assigned_workout_items").insert({
        assigned_workout_section_id: sectionId,
        source_exercise_id: data.exerciseId,
        name: (exercise?.name ?? data.customName) || "Custom activity",
        instructions: data.instructions || exercise?.coaching_cues || "",
        prescribed_sets: data.prescribedSets,
        prescribed_reps: data.prescribedReps,
        prescribed_load: data.prescribedLoad,
        prescribed_duration_seconds: parseOptionalInt(formData.get("prescribedDurationSeconds")),
        prescribed_distance: data.prescribedDistance,
        prescribed_unit: data.prescribedUnit,
        target_value: data.targetValue,
        target_unit: data.targetUnit,
        rest_seconds: parseOptionalInt(formData.get("restSeconds")),
        sort_order: nextOrder,
        required: data.required,
        result_entry_type: data.resultEntryType || exercise?.default_unit_type || "text"
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "update_item") {
      const itemId = String(formData.get("itemId") ?? "");
      const sectionId = String(formData.get("sectionId") ?? "");
      const parsed = workoutItemSchema.safeParse({
        itemId,
        sectionId,
        exerciseId: formData.get("exerciseId"),
        customName: formData.get("customName"),
        instructions: formData.get("instructions"),
        prescribedSets: formData.get("prescribedSets"),
        prescribedReps: formData.get("prescribedReps"),
        prescribedLoad: formData.get("prescribedLoad"),
        prescribedDurationSeconds: formData.get("prescribedDurationSeconds"),
        prescribedDistance: formData.get("prescribedDistance"),
        prescribedUnit: formData.get("prescribedUnit"),
        targetValue: formData.get("targetValue"),
        targetUnit: formData.get("targetUnit"),
        restSeconds: formData.get("restSeconds"),
        required: formData.get("required") ?? "true",
        resultEntryType: formData.get("resultEntryType")
      });

      if (!parsed.success) {
        redirectWithStatus(workoutPath, "error=invalid_item");
      }
      const data = parsed.data;

      const { data: exercise } = data.exerciseId
        ? await supabase.from("exercise_library").select("name").eq("id", data.exerciseId).maybeSingle()
        : { data: null };

      const { error } = await supabase
        .from("assigned_workout_items")
        .update({
          source_exercise_id: data.exerciseId,
          name: (exercise?.name ?? data.customName) || "Custom activity",
          instructions: data.instructions,
          prescribed_sets: data.prescribedSets,
          prescribed_reps: data.prescribedReps,
          prescribed_load: data.prescribedLoad,
          prescribed_duration_seconds: parseOptionalInt(formData.get("prescribedDurationSeconds")),
          prescribed_distance: data.prescribedDistance,
          prescribed_unit: data.prescribedUnit,
          target_value: data.targetValue,
          target_unit: data.targetUnit,
          rest_seconds: parseOptionalInt(formData.get("restSeconds")),
          required: data.required,
          result_entry_type: data.resultEntryType
        })
        .eq("id", itemId);

      if (error) {
        throw new Error(error.message);
      }
    }

    if (intent === "move_item") {
      const itemId = String(formData.get("itemId") ?? "");
      const sectionId = String(formData.get("sectionId") ?? "");
      const direction = String(formData.get("direction") ?? "up");
      const { data: items } = await supabase
        .from("assigned_workout_items")
        .select("id, sort_order")
        .eq("assigned_workout_section_id", sectionId)
        .order("sort_order");

      const currentIndex = (items ?? []).findIndex((item) => item.id === itemId);

      if (currentIndex >= 0) {
        const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (items && items[swapIndex]) {
          const current = items[currentIndex];
          const swap = items[swapIndex];

          await supabase.from("assigned_workout_items").update({ sort_order: swap.sort_order }).eq("id", current.id);
          await supabase.from("assigned_workout_items").update({ sort_order: current.sort_order }).eq("id", swap.id);
        }
      }
    }

    if (intent === "delete_item") {
      const itemId = String(formData.get("itemId") ?? "");
      await supabase.from("assigned_workout_items").delete().eq("id", itemId);
    }

    if (intent === "copy_workout") {
      const targetDate = String(formData.get("targetDate") ?? "");
      const targetAthleteId = String(formData.get("targetAthleteId") ?? athleteId);
      const targetWeekStart = getWeekStartIso(targetDate);
      const targetWeek = await ensureTrainingWeek(targetAthleteId, targetWeekStart, viewer.id);
      const workout = await getAssignedWorkoutForBuilder(viewer, athleteId, workoutId);

      if (!workout) {
        throw new Error("Workout not found.");
      }

      await copyAssignedWorkoutToNewTarget(supabase, workout, {
        athleteId: targetAthleteId,
        trainingWeekId: targetWeek.id,
        workoutDate: targetDate,
        createdBy: viewer.id,
        status: "draft"
      });
    }
  } catch {
    redirectWithStatus(workoutPath, "error=action_failed");
  }

  revalidatePath(workoutPath);
  revalidatePath(`/athletes/${athleteId}/weeks/${getWeekStartIso(String(formData.get("workoutDate") ?? new Date().toISOString().slice(0, 10)))}`);
  revalidatePath("/calendar");
  redirectWithStatus(workoutPath, "status=saved");
}

export async function assignTemplateFromLibraryAction(formData: FormData) {
  const viewer = await assertAdmin();
  const athleteId = String(formData.get("athleteId") ?? "");
  const workoutDate = String(formData.get("workoutDate") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const weekStart = getWeekStartIso(workoutDate);
  const weekPath = `/athletes/${athleteId}/weeks/${weekStart}`;

  if (!getSupabaseConfig()) {
    redirectWithStatus("/library/templates", "status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const template = await getWorkoutTemplateByIdForViewer(viewer, templateId);

  if (!template) {
    redirectWithStatus("/library/templates", "error=missing_template");
  }

  try {
    const week = await ensureTrainingWeek(athleteId, weekStart, viewer.id);
    await createWorkoutFromTemplate(supabase, template!, {
      athleteId,
      trainingWeekId: week.id,
      workoutDate,
      createdBy: viewer.id
    });
  } catch {
    redirectWithStatus("/library/templates", "error=assign_failed");
  }

  revalidatePath("/library/templates");
  revalidatePath(weekPath);
  redirectWithStatus("/library/templates", "status=assigned");
}

export async function saveAthleteWorkoutProgressAction(formData: FormData) {
  const viewer = await getAppViewer();

  if (!viewer || viewer.role !== "athlete" || !viewer.athleteId) {
    redirect("/login");
  }

  const workoutDate = String(formData.get("workoutDate") ?? "");
  const allowCompletedEdit = String(formData.get("allowCompletedEdit") ?? "false") === "true";
  const workoutPath = `/workouts/${workoutDate}`;

  if (!getSupabaseConfig()) {
    redirectWithStatus(workoutPath, "status=demo_mode");
  }

  const dailyWorkout = await getDailyWorkoutForViewer(viewer, workoutDate, viewer.athleteId, allowCompletedEdit);

  if (!dailyWorkout) {
    redirectWithStatus(workoutPath, "error=missing_workout");
  }

  if (dailyWorkout.status === "completed" && !allowCompletedEdit) {
    redirectWithStatus(workoutPath, "error=completed_locked");
  }

  const supabase = await createSupabaseServerClient();
  const intent = String(formData.get("intent") ?? "save_progress");
  const resultsPayload: Array<{
    assigned_workout_item_id: string;
    athlete_id: string;
    completed: boolean;
    actual_sets: string;
    actual_reps: string;
    actual_load: string;
    actual_duration_seconds: string;
    actual_distance: string;
    actual_value: string;
    actual_unit: string;
    rating: number | null;
    text_result: string;
    athlete_notes: string;
    completed_at: string | null;
  }> = [];

  const sections = dailyWorkout.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const completed = formData.get(`completed:${item.id}`) === "on";
      const actualSets = String(formData.get(`actualSets:${item.id}`) ?? "");
      const actualReps = String(formData.get(`actualReps:${item.id}`) ?? "");
      const actualLoad = String(formData.get(`actualLoad:${item.id}`) ?? "");
      const actualDurationSeconds = String(formData.get(`actualDurationSeconds:${item.id}`) ?? "");
      const actualDistance = String(formData.get(`actualDistance:${item.id}`) ?? "");
      const actualValue = String(formData.get(`actualValue:${item.id}`) ?? "");
      const actualUnit = String(formData.get(`actualUnit:${item.id}`) ?? "");
      const rating = parseOptionalInt(formData.get(`rating:${item.id}`));
      const textResult = String(formData.get(`textResult:${item.id}`) ?? "");
      const athleteNotes = String(formData.get(`itemNotes:${item.id}`) ?? "");

      resultsPayload.push({
        assigned_workout_item_id: item.id,
        athlete_id: viewer.athleteId!,
        completed,
        actual_sets: actualSets,
        actual_reps: actualReps,
        actual_load: actualLoad,
        actual_duration_seconds: actualDurationSeconds,
        actual_distance: actualDistance,
        actual_value: actualValue,
        actual_unit: actualUnit,
        rating,
        text_result: textResult,
        athlete_notes: athleteNotes,
        completed_at: completed ? new Date().toISOString() : null
      });

      return {
        ...item,
        result: {
          id: item.result?.id ?? `pending-${item.id}`,
          assignedWorkoutItemId: item.id,
          athleteId: viewer.athleteId!,
          completed,
          actualSets,
          actualReps,
          actualLoad,
          actualDurationSeconds,
          actualDistance,
          actualValue,
          actualUnit,
          rating: rating?.toString() ?? "",
          textResult,
          athleteNotes,
          completedAt: completed ? new Date().toISOString() : null
        }
      };
    })
  }));

  const progress = calculateWorkoutProgress(sections.flatMap((section) => section.items));

  if (intent === "complete_workout" && !progress.requiredComplete) {
    redirectWithStatus(workoutPath, "error=required_items_incomplete");
  }

  const readinessValues = {
    athlete_id: viewer.athleteId,
    assigned_workout_id: dailyWorkout.id,
    entered_by: viewer.id,
    sleep_hours: parseOptionalInt(formData.get("sleepHours")),
    sleep_quality: parseOptionalInt(formData.get("sleepQuality")),
    energy: parseOptionalInt(formData.get("energy")),
    soreness: parseOptionalInt(formData.get("soreness")),
    stress: parseOptionalInt(formData.get("stress")),
    body_weight: parseOptionalInt(formData.get("bodyWeight")),
    notes: String(formData.get("readinessNote") ?? "")
  };

  if (
    readinessValues.sleep_hours !== null ||
    readinessValues.sleep_quality !== null ||
    readinessValues.energy !== null ||
    readinessValues.soreness !== null ||
    readinessValues.stress !== null ||
    readinessValues.body_weight !== null ||
    readinessValues.notes
  ) {
    await supabase.from("athlete_readiness_logs").upsert(readinessValues, {
      onConflict: "athlete_id,assigned_workout_id"
    });
  }

  for (const payload of resultsPayload) {
    const hasContent =
      payload.completed ||
      payload.actual_sets ||
      payload.actual_reps ||
      payload.actual_load ||
      payload.actual_duration_seconds ||
      payload.actual_distance ||
      payload.actual_value ||
      payload.actual_unit ||
      payload.rating !== null ||
      payload.text_result ||
      payload.athlete_notes;

    if (!hasContent) {
      continue;
    }

    await supabase.from("workout_item_results").upsert(payload, {
      onConflict: "assigned_workout_item_id,athlete_id"
    });
  }

  const nextStatus = getWorkoutStatusAfterSave(dailyWorkout.status, {
    hasTouchedResults: resultsPayload.some(
      (payload) =>
        payload.completed ||
        payload.actual_sets ||
        payload.actual_reps ||
        payload.actual_load ||
        payload.actual_duration_seconds ||
        payload.actual_distance ||
        payload.actual_value ||
        payload.actual_unit ||
        payload.rating !== null ||
        payload.text_result ||
        payload.athlete_notes
    ),
    markComplete: intent === "complete_workout",
    markSkipped: false
  });

  const timestamp = new Date().toISOString();
  await supabase
    .from("assigned_workouts")
    .update({
      athlete_notes: String(formData.get("athleteNotes") ?? ""),
      started_at: dailyWorkout.startedAt ?? timestamp,
      completed_at: nextStatus === "completed" ? timestamp : null,
      status: nextStatus
    })
    .eq("id", dailyWorkout.id)
    .eq("athlete_id", viewer.athleteId);

  revalidatePath(workoutPath);
  revalidatePath("/calendar");
  redirectWithStatus(workoutPath, intent === "complete_workout" ? "status=completed" : "status=saved");
}
