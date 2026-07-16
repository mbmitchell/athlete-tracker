import { z } from "zod";

import type { ImportSaveStrategy } from "@/lib/import-plan/planning";

const workoutResultTypeSchema = z.enum([
  "checkbox",
  "sets_reps",
  "sets_reps_weight",
  "duration",
  "distance",
  "velocity",
  "count",
  "text",
  "numeric",
  "percentage",
  "rating"
]);

const importItemTypeSchema = z.enum([
  "checkbox",
  "readiness",
  "sets_reps",
  "sets_reps_weight",
  "duration",
  "distance",
  "velocity",
  "numeric",
  "rating",
  "text",
  "nutrition"
]);

const importPreviewItemSchema = z.object({
  id: z.string().min(1),
  lineNumber: z.number().int().min(1),
  name: z.string(),
  type: importItemTypeSchema,
  resultEntryType: workoutResultTypeSchema,
  recordTracking: z.string(),
  recordTrackingValues: z.array(z.string()),
  matchedExerciseId: z.string().nullable(),
  matchedExerciseName: z.string().nullable(),
  matchStatus: z.enum(["matched", "custom"]),
  instructions: z.string(),
  sets: z.string(),
  reps: z.string(),
  load: z.string(),
  duration: z.string(),
  distance: z.string(),
  target: z.string(),
  unit: z.string(),
  rest: z.string(),
  required: z.boolean()
});

const importPreviewSectionSchema = z.object({
  id: z.string().min(1),
  lineNumber: z.number().int().min(1),
  title: z.string(),
  items: z.array(importPreviewItemSchema)
});

const importPreviewDaySchema = z.object({
  id: z.string().min(1),
  lineNumber: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  objective: z.string(),
  estimatedMinutes: z.number().int().min(0).nullable(),
  sections: z.array(importPreviewSectionSchema)
});

export const importPreviewPlanSchema = z.object({
  athleteId: z.string().min(1),
  athleteName: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeklyFocus: z.string(),
  days: z.array(importPreviewDaySchema),
  warnings: z.array(
    z.object({
      lineNumber: z.number().int().min(1),
      field: z.string(),
      message: z.string(),
      originalLine: z.string()
    })
  ),
  errors: z.array(
    z.object({
      lineNumber: z.number().int().min(1),
      field: z.string(),
      message: z.string(),
      originalLine: z.string()
    })
  )
});

export const saveImportedPlanInputSchema = z.object({
  athleteId: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeklyFocus: z.string(),
  strategy: z.enum(["create_missing_days_only", "replace_selected_drafts"] satisfies [ImportSaveStrategy, ImportSaveStrategy]),
  replaceWorkoutIds: z.array(z.string()),
  plan: importPreviewPlanSchema
});
