import { z } from "zod";

import { splitTextareaList } from "@/lib/utils";

export const athleteProfileSchema = z.object({
  athleteId: z.string().optional(),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  graduationYear: z.coerce.number().int().min(2024).max(2035),
  dateOfBirth: z.string().optional().transform((value) => value || null),
  hometown: z.string().min(1, "Hometown is required."),
  primaryPosition: z.string().min(1, "Primary position is required."),
  secondaryPosition: z.string().optional().transform((value) => value || null),
  height: z.string().optional().transform((value) => value || null),
  weight: z.string().optional().transform((value) => value || null),
  currentTeam: z.string().optional().transform((value) => value || null),
  developmentGoals: z.string().optional().transform((value) => splitTextareaList(value)),
  availableEquipment: z.string().optional().transform((value) => splitTextareaList(value)),
  restrictionsOrInjuryNotes: z.string().optional().transform((value) => value || null),
  recruitingNotes: z.string().optional().transform((value) => value || null),
  currentDevelopmentFocus: z.string().optional().transform((value) => value || null),
  activeStatus: z.enum(["active", "inactive"])
});

export type AthleteProfileInput = z.infer<typeof athleteProfileSchema>;
