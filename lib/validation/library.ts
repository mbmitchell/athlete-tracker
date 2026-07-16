import { z } from "zod";

export const exerciseLibrarySchema = z.object({
  exerciseId: z.string().optional(),
  name: z.string().min(1, "Exercise name is required."),
  category: z.enum([
    "readiness",
    "warm_up",
    "mobility",
    "strength",
    "power",
    "speed",
    "agility",
    "hitting",
    "throwing",
    "catching",
    "defense",
    "pitching",
    "recovery",
    "nutrition",
    "recruiting",
    "custom"
  ]),
  description: z.string().optional().transform((value) => value ?? ""),
  coachingCues: z.string().optional().transform((value) => value ?? ""),
  defaultUnitType: z.enum([
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
  ]),
  equipment: z.string().optional().transform((value) => value ?? ""),
  videoUrl: z.string().url().optional().or(z.literal("")).transform((value) => value || null),
  active: z.enum(["true", "false"]).transform((value) => value === "true")
});

export const workoutTemplateSchema = z.object({
  templateId: z.string().optional(),
  name: z.string().min(1, "Template name is required."),
  description: z.string().optional().transform((value) => value ?? ""),
  estimatedDurationMinutes: z.coerce.number().int().min(0).nullable().or(z.nan()).transform((value) =>
    Number.isNaN(value) ? null : value
  ),
  focus: z.string().optional().transform((value) => value ?? ""),
  active: z.enum(["true", "false"]).transform((value) => value === "true")
});
