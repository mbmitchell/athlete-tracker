export type UserRole = "admin" | "athlete" | "parent";
export type AthleteLoginStatus = "none" | "invited" | "connected" | "disabled";
export type ReadinessStatus = "ready" | "monitor" | "recover";
export type CompletionStatus = "not_started" | "in_progress" | "completed";
export type ExerciseCategory =
  | "readiness"
  | "warm_up"
  | "mobility"
  | "strength"
  | "power"
  | "speed"
  | "agility"
  | "hitting"
  | "throwing"
  | "catching"
  | "defense"
  | "pitching"
  | "recovery"
  | "nutrition"
  | "recruiting"
  | "custom";
export type WorkoutResultType =
  | "checkbox"
  | "sets_reps"
  | "sets_reps_weight"
  | "duration"
  | "distance"
  | "velocity"
  | "count"
  | "text"
  | "numeric"
  | "percentage"
  | "rating";
export type TrainingWeekStatus = "draft" | "published" | "archived";
export type AssignedWorkoutStatus =
  | "draft"
  | "published"
  | "in_progress"
  | "completed"
  | "skipped";

export type AppViewer = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  mode: "demo" | "authenticated";
  athleteId: string | null;
  connectedAthleteIds: string[];
  accessState: "active" | "athlete_unlinked" | "athlete_disabled";
};

export type AthleteAccountConnection = {
  status: AthleteLoginStatus;
  email: string;
  userId: string | null;
  invitedAt: string | null;
  connectedAt: string | null;
  disabledAt: string | null;
};

export type AthleteProfile = {
  id: string;
  firstName: string;
  lastName: string;
  graduationYear: number;
  dateOfBirth: string | null;
  hometown: string;
  primaryPosition: string;
  secondaryPosition: string;
  height: string;
  weight: string;
  currentTeam: string;
  developmentGoals: string[];
  availableEquipment: string[];
  restrictionsOrInjuryNotes: string;
  recruitingNotes: string;
  active: boolean;
  currentDevelopmentFocus: string;
  accountConnection: AthleteAccountConnection;
};

export type AthleteSummary = {
  id: string;
  displayName: string;
};

export type ExerciseLibraryEntry = {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  coachingCues: string;
  defaultUnitType: WorkoutResultType;
  equipment: string;
  videoUrl: string | null;
  active: boolean;
};

export type WorkoutTemplateItem = {
  id: string;
  exerciseId: string | null;
  customName: string | null;
  instructions: string;
  prescribedSets: string;
  prescribedReps: string;
  prescribedLoad: string;
  prescribedDurationSeconds: string;
  prescribedDistance: string;
  prescribedUnit: string;
  targetValue: string;
  targetUnit: string;
  restSeconds: string;
  sortOrder: number;
  required: boolean;
  resultEntryType: WorkoutResultType;
  notes: string;
  exerciseName?: string;
};

export type WorkoutTemplateSection = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  items: WorkoutTemplateItem[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string;
  estimatedDurationMinutes: number | null;
  focus: string;
  active: boolean;
  sections: WorkoutTemplateSection[];
};

export type WorkoutItemResult = {
  id: string;
  assignedWorkoutItemId: string;
  athleteId: string;
  completed: boolean;
  actualSets: string;
  actualReps: string;
  actualLoad: string;
  actualDurationSeconds: string;
  actualDistance: string;
  actualValue: string;
  actualUnit: string;
  rating: string;
  textResult: string;
  athleteNotes: string;
  completedAt: string | null;
};

export type AssignedWorkoutItem = {
  id: string;
  sourceExerciseId: string | null;
  name: string;
  instructions: string;
  prescribedSets: string;
  prescribedReps: string;
  prescribedLoad: string;
  prescribedDurationSeconds: string;
  prescribedDistance: string;
  prescribedUnit: string;
  targetValue: string;
  targetUnit: string;
  restSeconds: string;
  sortOrder: number;
  required: boolean;
  resultEntryType: WorkoutResultType;
  result: WorkoutItemResult | null;
};

export type AssignedWorkoutSection = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  items: AssignedWorkoutItem[];
};

export type WorkoutReadinessEntry = {
  id: string;
  athleteId: string;
  assignedWorkoutId: string | null;
  sleepHours: string;
  sleepQuality: string;
  energy: string;
  soreness: string;
  stress: string;
  bodyWeight: string;
  note: string;
  recordedAt: string | null;
};

export type AssignedWorkout = {
  id: string;
  athleteId: string;
  trainingWeekId: string | null;
  sourceTemplateId: string | null;
  workoutDate: string;
  title: string;
  objective: string;
  estimatedDurationMinutes: number | null;
  status: AssignedWorkoutStatus;
  adminNotes: string;
  athleteNotes: string;
  skipReason: string;
  startedAt: string | null;
  completedAt: string | null;
  sections: AssignedWorkoutSection[];
  readinessEntry: WorkoutReadinessEntry | null;
};

export type WorkoutSummary = {
  id: string;
  athleteId: string;
  workoutDate: string;
  title: string;
  objective: string;
  estimatedDurationMinutes: number | null;
  status: AssignedWorkoutStatus;
  sourceTemplateId: string | null;
};

export type TrainingWeek = {
  id: string;
  athleteId: string;
  weekStartDate: string;
  title: string;
  focus: string;
  status: TrainingWeekStatus;
  adminNotes: string;
  workouts: WorkoutSummary[];
};

export type WeekPlanDay = {
  date: string;
  label: string;
  fullLabel: string;
  workout: WorkoutSummary | null;
};

export type TrainingWeekDetail = TrainingWeek & {
  athleteName: string;
  days: WeekPlanDay[];
};

export type AdminDashboardCard = {
  athleteId: string;
  athleteName: string;
  graduationYear: number;
  positions: string[];
  todayCompletionStatus: AssignedWorkoutStatus | "not_assigned";
  currentDevelopmentFocus: string;
  latestReadinessStatus: ReadinessStatus | "unknown";
  latestBodyWeight: string;
};

export type WeeklyCalendarDay = {
  date: string;
  label: string;
  focus: string;
  status: AssignedWorkoutStatus | "not_assigned";
  href: string;
};

export type DailyWorkout = {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  workoutDateIso: string;
  sessionTitle: string;
  sessionObjective: string;
  estimatedDuration: string;
  status: AssignedWorkoutStatus;
  sections: AssignedWorkoutSection[];
  athleteNotes: string;
  readinessEntry: WorkoutReadinessEntry | null;
  canEdit: boolean;
  canMarkComplete: boolean;
  progressPercent: number;
  requiredItemsSummary: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type AdminSetupSummary = {
  supabaseStatus: "demo" | "configured";
  serviceRoleStatus: "configured" | "missing";
  migrationsStatus: "ready" | "unknown";
  currentRole: UserRole;
  athleteCount: number;
  linkedAthleteAccountCount: number;
  publishedWorkoutCount: number;
  checks: {
    label: string;
    status: "pass" | "warn";
    detail: string;
  }[];
};

export type NavigationItem = {
  href: string;
  label: string;
  icon: "home" | "users" | "calendar" | "clipboard" | "book" | "settings";
};
