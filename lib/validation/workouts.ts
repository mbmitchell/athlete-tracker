import { z } from "zod";

export const trainingWeekSchema = z.object({
  weekId: z.string().optional(),
  athleteId: z.string(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1, "Week title is required."),
  focus: z.string().optional().transform((value) => value ?? ""),
  adminNotes: z.string().optional().transform((value) => value ?? "")
});

export const assignedWorkoutSchema = z.object({
  workoutId: z.string().optional(),
  athleteId: z.string(),
  trainingWeekId: z.string().nullable().optional(),
  workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1, "Workout title is required."),
  objective: z.string().optional().transform((value) => value ?? ""),
  estimatedDurationMinutes: z.coerce.number().int().min(0).nullable().or(z.nan()).transform((value) =>
    Number.isNaN(value) ? null : value
  ),
  adminNotes: z.string().optional().transform((value) => value ?? ""),
  skipReason: z.string().optional().transform((value) => value ?? "")
});

export const workoutSectionSchema = z.object({
  sectionId: z.string().optional(),
  workoutId: z.string(),
  title: z.string().min(1, "Section title is required."),
  description: z.string().optional().transform((value) => value ?? "")
});

export const workoutItemSchema = z.object({
  itemId: z.string().optional(),
  sectionId: z.string(),
  exerciseId: z.string().optional().transform((value) => value || null),
  customName: z.string().optional().transform((value) => value || ""),
  instructions: z.string().optional().transform((value) => value ?? ""),
  prescribedSets: z.string().optional().transform((value) => value ?? ""),
  prescribedReps: z.string().optional().transform((value) => value ?? ""),
  prescribedLoad: z.string().optional().transform((value) => value ?? ""),
  prescribedDurationSeconds: z.string().optional().transform((value) => value ?? ""),
  prescribedDistance: z.string().optional().transform((value) => value ?? ""),
  prescribedUnit: z.string().optional().transform((value) => value ?? ""),
  targetValue: z.string().optional().transform((value) => value ?? ""),
  targetUnit: z.string().optional().transform((value) => value ?? ""),
  restSeconds: z.string().optional().transform((value) => value ?? ""),
  required: z.enum(["true", "false"]).transform((value) => value === "true"),
  resultEntryType: z.enum([
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
  ])
});
