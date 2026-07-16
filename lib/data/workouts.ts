import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getMockAssignedWorkoutByDate,
  getMockAssignedWorkoutById,
  getMockTrainingWeek,
  getMockWeekDays,
  mockAssignedWorkouts
} from "@/lib/data/mock-data";
import type {
  AppViewer,
  AssignedWorkout,
  AssignedWorkoutItem,
  AssignedWorkoutSection,
  AthleteSummary,
  DailyWorkout,
  TrainingWeekDetail,
  WorkoutReadinessEntry,
  WorkoutSummary
} from "@/lib/types/domain";
import { formatLongDate, getWeekStartIso } from "@/lib/workouts/date";
import { calculateWorkoutProgress } from "@/lib/workouts/progress";
import { getAthleteByIdForViewer, getAthleteSummariesForViewer } from "@/lib/data/athletes";

function coerceSelectedAthleteId(viewer: AppViewer, athleteId?: string | null): string | null {
  if (viewer.role === "athlete") {
    return viewer.athleteId;
  }

  if (athleteId && viewer.connectedAthleteIds.includes(athleteId)) {
    return athleteId;
  }

  return viewer.connectedAthleteIds[0] ?? null;
}

function summarizeAssignedWorkout(workout: AssignedWorkout): WorkoutSummary {
  return {
    id: workout.id,
    athleteId: workout.athleteId,
    workoutDate: workout.workoutDate,
    title: workout.title,
    objective: workout.objective,
    estimatedDurationMinutes: workout.estimatedDurationMinutes,
    status: workout.status,
    sourceTemplateId: workout.sourceTemplateId
  };
}

function buildDailyWorkoutModel(
  workout: AssignedWorkout,
  athleteName: string,
  canEdit: boolean
): DailyWorkout {
  const progress = calculateWorkoutProgress(workout.sections.flatMap((section) => section.items));

  return {
    id: workout.id,
    athleteId: workout.athleteId,
    athleteName,
    date: formatLongDate(workout.workoutDate),
    workoutDateIso: workout.workoutDate,
    sessionTitle: workout.title,
    sessionObjective: workout.objective,
    estimatedDuration: workout.estimatedDurationMinutes
      ? `${workout.estimatedDurationMinutes} minutes`
      : "Not set",
    status: workout.status,
    sections: workout.sections,
    athleteNotes: workout.athleteNotes,
    readinessEntry: workout.readinessEntry,
    canEdit,
    canMarkComplete: progress.requiredComplete && workout.status !== "completed",
    progressPercent: progress.percent,
    requiredItemsSummary: `${progress.completedRequired}/${progress.totalRequired} required items complete`,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt
  };
}

function mapAssignedWorkoutRow(row: {
  id: string;
  athlete_id: string;
  training_week_id: string | null;
  source_template_id: string | null;
  workout_date: string;
  title: string;
  objective: string | null;
  estimated_duration_minutes: number | null;
  status: AssignedWorkout["status"];
  admin_notes: string | null;
  athlete_notes: string | null;
  skip_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
}): AssignedWorkout {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    trainingWeekId: row.training_week_id,
    sourceTemplateId: row.source_template_id,
    workoutDate: row.workout_date,
    title: row.title,
    objective: row.objective ?? "",
    estimatedDurationMinutes: row.estimated_duration_minutes,
    status: row.status,
    adminNotes: row.admin_notes ?? "",
    athleteNotes: row.athlete_notes ?? "",
    skipReason: row.skip_reason ?? "",
    startedAt: row.started_at,
    completedAt: row.completed_at,
    sections: [],
    readinessEntry: null
  };
}

function mapReadinessRow(row: {
  id: string;
  athlete_id: string;
  assigned_workout_id: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy: number | null;
  soreness: number | null;
  stress: number | null;
  body_weight: number | null;
  notes: string | null;
  recorded_at: string;
}): WorkoutReadinessEntry {
  return {
    id: row.id,
    athleteId: row.athlete_id,
    assignedWorkoutId: row.assigned_workout_id,
    sleepHours: row.sleep_hours?.toString() ?? "",
    sleepQuality: row.sleep_quality?.toString() ?? "",
    energy: row.energy?.toString() ?? "",
    soreness: row.soreness?.toString() ?? "",
    stress: row.stress?.toString() ?? "",
    bodyWeight: row.body_weight?.toString() ?? "",
    note: row.notes ?? "",
    recordedAt: row.recorded_at
  };
}

async function hydrateAssignedWorkout(baseWorkout: AssignedWorkout): Promise<AssignedWorkout> {
  if (!isSupabaseConfigured()) {
    return baseWorkout;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: sectionRows }, { data: itemRows }, { data: resultRows }, { data: readinessRow }] =
    await Promise.all([
      supabase
        .from("assigned_workout_sections")
        .select("id, assigned_workout_id, title, description, sort_order")
        .eq("assigned_workout_id", baseWorkout.id)
        .order("sort_order"),
      supabase
        .from("assigned_workout_items")
        .select(
          "id, assigned_workout_section_id, source_exercise_id, name, instructions, prescribed_sets, prescribed_reps, prescribed_load, prescribed_duration_seconds, prescribed_distance, prescribed_unit, target_value, target_unit, rest_seconds, sort_order, required, result_entry_type"
        )
        .order("sort_order"),
      supabase
        .from("workout_item_results")
        .select(
          "id, assigned_workout_item_id, athlete_id, completed, actual_sets, actual_reps, actual_load, actual_duration_seconds, actual_distance, actual_value, actual_unit, rating, text_result, athlete_notes, completed_at"
        )
        .eq("athlete_id", baseWorkout.athleteId),
      supabase
        .from("athlete_readiness_logs")
        .select(
          "id, athlete_id, assigned_workout_id, sleep_hours, sleep_quality, energy, soreness, stress, body_weight, notes, recorded_at"
        )
        .eq("assigned_workout_id", baseWorkout.id)
        .maybeSingle()
    ]);

  const resultByItemId = new Map(
    (resultRows ?? []).map((row) => [
      row.assigned_workout_item_id,
      {
        id: row.id,
        assignedWorkoutItemId: row.assigned_workout_item_id,
        athleteId: row.athlete_id,
        completed: row.completed,
        actualSets: row.actual_sets ?? "",
        actualReps: row.actual_reps ?? "",
        actualLoad: row.actual_load ?? "",
        actualDurationSeconds: row.actual_duration_seconds ?? "",
        actualDistance: row.actual_distance ?? "",
        actualValue: row.actual_value ?? "",
        actualUnit: row.actual_unit ?? "",
        rating: row.rating?.toString() ?? "",
        textResult: row.text_result ?? "",
        athleteNotes: row.athlete_notes ?? "",
        completedAt: row.completed_at
      }
    ])
  );

  const itemsBySectionId = new Map<string, AssignedWorkoutItem[]>();
  (itemRows ?? []).forEach((row) => {
    if (!itemsBySectionId.has(row.assigned_workout_section_id)) {
      itemsBySectionId.set(row.assigned_workout_section_id, []);
    }

    itemsBySectionId.get(row.assigned_workout_section_id)?.push({
      id: row.id,
      sourceExerciseId: row.source_exercise_id,
      name: row.name,
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
      result: resultByItemId.get(row.id) ?? null
    });
  });

  const sections: AssignedWorkoutSection[] = (sectionRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    sortOrder: row.sort_order,
    items: itemsBySectionId.get(row.id) ?? []
  }));

  return {
    ...baseWorkout,
    sections,
    readinessEntry: readinessRow ? mapReadinessRow(readinessRow) : null
  };
}

export const getTrainingWeekForAdmin = cache(
  async (viewer: AppViewer, athleteId: string, weekStart: string): Promise<TrainingWeekDetail | null> => {
    const athlete = await getAthleteByIdForViewer(viewer, athleteId);

    if (!athlete || viewer.role !== "admin") {
      return null;
    }

    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      const week = getMockTrainingWeek(athleteId, weekStart);

      return {
        id: week?.id ?? "",
        athleteId,
        weekStartDate: weekStart,
        title: week?.title ?? `Week of ${weekStart}`,
        focus: week?.focus ?? "",
        status: week?.status ?? "draft",
        adminNotes: week?.adminNotes ?? "",
        workouts: week?.workouts ?? [],
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        days: getMockWeekDays(athleteId, weekStart)
      };
    }

    const supabase = await createSupabaseServerClient();
    const weekEnd = new Date(`${weekStart}T00:00:00Z`);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const weekEndIso = weekEnd.toISOString().slice(0, 10);

    const [{ data: weekRow }, { data: workoutRows }] = await Promise.all([
      supabase
        .from("training_weeks")
        .select("id, athlete_id, week_start_date, title, focus, status, admin_notes")
        .eq("athlete_id", athleteId)
        .eq("week_start_date", weekStart)
        .maybeSingle(),
      supabase
        .from("assigned_workouts")
        .select("id, athlete_id, workout_date, title, objective, estimated_duration_minutes, status, source_template_id")
        .eq("athlete_id", athleteId)
        .gte("workout_date", weekStart)
        .lte("workout_date", weekEndIso)
        .order("workout_date")
    ]);

    const workouts: WorkoutSummary[] =
      workoutRows?.map((row) => ({
        id: row.id,
        athleteId: row.athlete_id,
        workoutDate: row.workout_date,
        title: row.title,
        objective: row.objective ?? "",
        estimatedDurationMinutes: row.estimated_duration_minutes,
        status: row.status,
        sourceTemplateId: row.source_template_id
      })) ?? [];

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(`${weekStart}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + index);
      const iso = date.toISOString().slice(0, 10);

      return {
        date: iso,
        label: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date),
        fullLabel: formatLongDate(iso),
        workout: workouts.find((workout) => workout.workoutDate === iso) ?? null
      };
    });

    return {
      id: weekRow?.id ?? "",
      athleteId,
      weekStartDate: weekStart,
      title: weekRow?.title ?? `Week of ${weekStart}`,
      focus: weekRow?.focus ?? "",
      status: weekRow?.status ?? "draft",
      adminNotes: weekRow?.admin_notes ?? "",
      workouts,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      days
    };
  }
);

export const getAssignedWorkoutForBuilder = cache(
  async (viewer: AppViewer, athleteId: string, workoutId: string): Promise<AssignedWorkout | null> => {
    if (viewer.role !== "admin") {
      return null;
    }

    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      const workout = getMockAssignedWorkoutById(workoutId);
      return workout?.athleteId === athleteId ? workout : null;
    }

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("assigned_workouts")
      .select(
        "id, athlete_id, training_week_id, source_template_id, workout_date, title, objective, estimated_duration_minutes, status, admin_notes, athlete_notes, skip_reason, started_at, completed_at"
      )
      .eq("id", workoutId)
      .eq("athlete_id", athleteId)
      .maybeSingle();

    if (!data) {
      return null;
    }

    return hydrateAssignedWorkout(mapAssignedWorkoutRow(data));
  }
);

export const getAssignedWorkoutForViewerByDate = cache(
  async (
    viewer: AppViewer,
    workoutDate: string,
    athleteId?: string | null
  ): Promise<AssignedWorkout | null> => {
    const selectedAthleteId = coerceSelectedAthleteId(viewer, athleteId);

    if (!selectedAthleteId) {
      return null;
    }

    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      return getMockAssignedWorkoutByDate(selectedAthleteId, workoutDate);
    }

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("assigned_workouts")
      .select(
        "id, athlete_id, training_week_id, source_template_id, workout_date, title, objective, estimated_duration_minutes, status, admin_notes, athlete_notes, skip_reason, started_at, completed_at"
      )
      .eq("athlete_id", selectedAthleteId)
      .eq("workout_date", workoutDate)
      .maybeSingle();

    if (!data) {
      return null;
    }

    return hydrateAssignedWorkout(mapAssignedWorkoutRow(data));
  }
);

export const getDailyWorkoutForViewer = cache(
  async (
    viewer: AppViewer,
    workoutDate: string,
    athleteId?: string | null,
    allowCompletedEdit = false
  ): Promise<DailyWorkout | null> => {
    const workout = await getAssignedWorkoutForViewerByDate(viewer, workoutDate, athleteId);

    if (!workout) {
      return null;
    }

    const athlete = await getAthleteByIdForViewer(viewer, workout.athleteId);
    const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : "Athlete";
    const canEdit =
      viewer.role === "athlete" &&
      viewer.athleteId === workout.athleteId &&
      (workout.status !== "completed" || allowCompletedEdit);

    return buildDailyWorkoutModel(workout, athleteName, canEdit);
  }
);

export const getWeeklyCalendarDaysForViewer = cache(
  async (
    viewer: AppViewer,
    referenceDate: string,
    athleteId?: string | null
  ): Promise<{
    athleteId: string;
    athleteName: string;
    weekStart: string;
    days: { date: string; label: string; focus: string; status: WorkoutSummary["status"] | "not_assigned"; href: string }[];
  } | null> => {
    const selectedAthleteId = coerceSelectedAthleteId(viewer, athleteId);

    if (!selectedAthleteId) {
      return null;
    }

    const weekStart = getWeekStartIso(referenceDate);
    const week = await getTrainingWeekForAdmin(
      viewer.role === "admin"
        ? viewer
        : {
            ...viewer,
            role: "admin"
          },
      selectedAthleteId,
      weekStart
    );

    const athlete = await getAthleteByIdForViewer(viewer, selectedAthleteId);
    const athleteName = athlete ? `${athlete.firstName} ${athlete.lastName}` : "Athlete";

    if (!week) {
      return {
        athleteId: selectedAthleteId,
        athleteName,
        weekStart,
        days: []
      };
    }

    return {
      athleteId: selectedAthleteId,
      athleteName,
      weekStart,
      days: week.days.map((day) => ({
        date: day.date,
        label: day.label,
        focus: day.workout?.objective || "No workout assigned",
        status: day.workout?.status ?? "not_assigned",
        href: `/workouts/${day.date}?athleteId=${selectedAthleteId}`
      }))
    };
  }
);

export const getAllAssignedWorkoutsForViewer = cache(
  async (viewer: AppViewer): Promise<AssignedWorkout[]> => {
    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      return mockAssignedWorkouts.filter((workout) => viewer.connectedAthleteIds.includes(workout.athleteId));
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("assigned_workouts")
      .select(
        "id, athlete_id, training_week_id, source_template_id, workout_date, title, objective, estimated_duration_minutes, status, admin_notes, athlete_notes, skip_reason, started_at, completed_at"
      )
      .order("workout_date");

    if (viewer.role === "admin") {
      query = query.in("athlete_id", viewer.connectedAthleteIds);
    } else if (viewer.athleteId) {
      query = query.eq("athlete_id", viewer.athleteId);
    } else if (viewer.connectedAthleteIds.length > 0) {
      query = query.in("athlete_id", viewer.connectedAthleteIds);
    } else {
      return [];
    }

    const { data } = await query;

    return Promise.all((data ?? []).map((row) => hydrateAssignedWorkout(mapAssignedWorkoutRow(row))));
  }
);

export const getAthleteOptionsForViewer = cache(
  async (viewer: AppViewer): Promise<AthleteSummary[]> => getAthleteSummariesForViewer(viewer)
);
