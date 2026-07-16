import type { WorkoutResultType } from "@/lib/types/domain";

export const supportedImportLabels = [
  "ATHLETE",
  "WEEK START",
  "WEEKLY FOCUS",
  "DAY",
  "TITLE",
  "OBJECTIVE",
  "ESTIMATED MINUTES",
  "SECTION",
  "ITEM",
  "TYPE",
  "INSTRUCTIONS",
  "SETS",
  "REPS",
  "LOAD",
  "DURATION",
  "DISTANCE",
  "TARGET",
  "UNIT",
  "REST",
  "REQUIRED",
  "RECORD"
] as const;

export type SupportedImportLabel = (typeof supportedImportLabels)[number];

export const supportedImportItemTypes = [
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
] as const;

export type ImportItemType = (typeof supportedImportItemTypes)[number];

export type ParseIssue = {
  lineNumber: number;
  field: string;
  message: string;
  originalLine: string;
};

export type ParsedPlan = {
  athleteName?: string;
  weekStart?: string;
  weeklyFocus?: string;
  days: ParsedDay[];
  warnings: ParseIssue[];
  errors: ParseIssue[];
};

export type ParsedDay = {
  id: string;
  lineNumber: number;
  date?: string;
  title?: string;
  objective?: string;
  estimatedMinutes?: number | null;
  sections: ParsedSection[];
};

export type ParsedSection = {
  id: string;
  lineNumber: number;
  title?: string;
  items: ParsedItem[];
};

export type ParsedItem = {
  id: string;
  lineNumber: number;
  name?: string;
  type?: ImportItemType;
  record?: string;
  recordValues?: string[];
  instructions?: string;
  sets?: string;
  reps?: string;
  load?: string;
  duration?: string;
  distance?: string;
  target?: string;
  unit?: string;
  rest?: string;
  required?: boolean;
};

export type ImportMatchStatus = "matched" | "custom";

export type ImportPreviewItem = {
  id: string;
  lineNumber: number;
  name: string;
  type: ImportItemType;
  resultEntryType: WorkoutResultType;
  recordTracking: string;
  recordTrackingValues: string[];
  matchedExerciseId: string | null;
  matchedExerciseName: string | null;
  matchStatus: ImportMatchStatus;
  instructions: string;
  sets: string;
  reps: string;
  load: string;
  duration: string;
  distance: string;
  target: string;
  unit: string;
  rest: string;
  required: boolean;
};

export type ImportPreviewSection = {
  id: string;
  lineNumber: number;
  title: string;
  items: ImportPreviewItem[];
};

export type ImportPreviewDay = {
  id: string;
  lineNumber: number;
  date: string;
  title: string;
  objective: string;
  estimatedMinutes: number | null;
  sections: ImportPreviewSection[];
};

export type ImportPreviewPlan = {
  athleteId: string;
  athleteName: string;
  weekStart: string;
  weeklyFocus: string;
  days: ImportPreviewDay[];
  warnings: ParseIssue[];
  errors: ParseIssue[];
};

export type ExistingImportWorkout = {
  id: string;
  workoutDate: string;
  title: string;
  status: "draft" | "published" | "in_progress" | "completed" | "skipped";
  hasResults: boolean;
};

export type ImportConflict = {
  date: string;
  existingWorkoutId: string;
  title: string;
  status: ExistingImportWorkout["status"];
  hasResults: boolean;
  allowCreateMissingDays: boolean;
  allowReplaceDraft: boolean;
  blockingReason: string | null;
};
