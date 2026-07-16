import { cache } from "react";

import type {
  AdminDashboardCard,
  AdminSetupSummary,
  AppViewer,
  AthleteProfile,
  AthleteSummary
} from "@/lib/types/domain";
import { normalizeAthleteLoginStatus } from "@/lib/athletes/account-management";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockAdminDashboardCards, mockAthletes } from "@/lib/data/mock-data";
import {
  isDemoMode,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured
} from "@/lib/env";
import { requireSupabaseResult } from "@/lib/supabase/errors";

function mapAthlete(row: {
  id: string;
  first_name: string;
  last_name: string;
  athlete_login_status: string | null;
  login_email: string | null;
  user_id: string | null;
  invited_at: string | null;
  connected_at: string | null;
  disabled_at: string | null;
  graduation_year: number;
  date_of_birth: string | null;
  hometown: string;
  primary_position: string;
  secondary_position: string | null;
  height: string | null;
  weight: string | null;
  current_team: string | null;
  development_goals: string[];
  available_equipment: string[];
  restrictions_or_injury_notes: string | null;
  recruiting_notes: string | null;
  current_development_focus: string | null;
  active: boolean;
}): AthleteProfile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    graduationYear: row.graduation_year,
    dateOfBirth: row.date_of_birth,
    hometown: row.hometown,
    primaryPosition: row.primary_position,
    secondaryPosition: row.secondary_position ?? "",
    height: row.height ?? "",
    weight: row.weight ?? "",
    currentTeam: row.current_team ?? "",
    developmentGoals: row.development_goals ?? [],
    availableEquipment: row.available_equipment ?? [],
    restrictionsOrInjuryNotes: row.restrictions_or_injury_notes ?? "",
    recruitingNotes: row.recruiting_notes ?? "",
    active: row.active,
    currentDevelopmentFocus: row.current_development_focus ?? "",
    accountConnection: {
      status: normalizeAthleteLoginStatus(row.athlete_login_status),
      email: row.login_email ?? "",
      userId: row.user_id,
      invitedAt: row.invited_at,
      connectedAt: row.connected_at,
      disabledAt: row.disabled_at
    }
  };
}

export const getAthletesForViewer = cache(async (viewer: AppViewer): Promise<AthleteProfile[]> => {
  if (!isSupabaseConfigured() || viewer.mode === "demo") {
    return mockAthletes;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("athletes").select("*").order("last_name").order("first_name");

  if (viewer.role === "admin") {
    query = query.eq("managed_by", viewer.id);
  } else if (viewer.connectedAthleteIds.length > 0) {
    query = query.in("id", viewer.connectedAthleteIds);
  } else {
    return [];
  }

  const data = requireSupabaseResult(await query, "Unable to load athletes");
  return data?.map(mapAthlete) ?? [];
});

export const getAthleteByIdForViewer = cache(
  async (viewer: AppViewer, athleteId: string): Promise<AthleteProfile | null> => {
    const athletes = await getAthletesForViewer(viewer);
    return athletes.find((athlete) => athlete.id === athleteId) ?? null;
  }
);

export const getAthleteSummariesForViewer = cache(
  async (viewer: AppViewer): Promise<AthleteSummary[]> => {
    const athletes = await getAthletesForViewer(viewer);

    return athletes.map((athlete) => ({
      id: athlete.id,
      displayName: `${athlete.firstName} ${athlete.lastName}`
    }));
  }
);

export const getAdminDashboardCardsForViewer = cache(
  async (viewer: AppViewer): Promise<AdminDashboardCard[]> => {
    if (viewer.role !== "admin") {
      return [];
    }

    if (!isSupabaseConfigured() || viewer.mode === "demo") {
      return mockAdminDashboardCards;
    }

    const athletes = await getAthletesForViewer(viewer);

    if (athletes.length === 0) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const athleteIds = athletes.map((athlete) => athlete.id);
    const today = new Date().toISOString().slice(0, 10);

    const [readinessResult, workoutResult] = await Promise.all([
      supabase
        .from("athlete_readiness_logs")
        .select("athlete_id, readiness_status, body_weight, development_focus, recorded_at")
        .in("athlete_id", athleteIds)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("assigned_workouts")
        .select("athlete_id, status")
        .in("athlete_id", athleteIds)
        .eq("workout_date", today)
    ]);

    const readinessRows = requireSupabaseResult(
      readinessResult,
      "Unable to load athlete readiness rows"
    );
    const workoutRows = requireSupabaseResult(workoutResult, "Unable to load assigned workouts");

    type ReadinessRow = NonNullable<typeof readinessRows>[number];

    const readinessByAthlete = new Map<string, ReadinessRow>();
    readinessRows?.forEach((row) => {
      if (!readinessByAthlete.has(row.athlete_id)) {
        readinessByAthlete.set(row.athlete_id, row);
      }
    });

    const completionByAthlete = new Map<string, AdminDashboardCard["todayCompletionStatus"]>();
    workoutRows?.forEach((row) => {
      completionByAthlete.set(row.athlete_id, row.status);
    });

    return athletes.map((athlete) => {
      const readiness = readinessByAthlete.get(athlete.id);

      return {
        athleteId: athlete.id,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        graduationYear: athlete.graduationYear,
        positions: [athlete.primaryPosition, athlete.secondaryPosition].filter(Boolean),
        todayCompletionStatus: completionByAthlete.get(athlete.id) ?? "not_assigned",
        currentDevelopmentFocus:
          readiness?.development_focus ?? athlete.currentDevelopmentFocus ?? "Not set",
        latestReadinessStatus: readiness?.readiness_status ?? "unknown",
        latestBodyWeight: readiness?.body_weight ? `${readiness.body_weight} lb` : athlete.weight || "-"
      };
    });
  }
);

export const getAdminSetupSummary = cache(async (viewer: AppViewer): Promise<AdminSetupSummary> => {
  if (viewer.role !== "admin") {
    throw new Error("Only admins can view setup details.");
  }

  if (!isSupabaseConfigured() || viewer.mode === "demo") {
    return {
      supabaseStatus: "demo",
      serviceRoleStatus: isSupabaseServiceRoleConfigured() ? "configured" : "missing",
      migrationsStatus: "unknown",
      currentRole: viewer.role,
      athleteCount: mockAthletes.length,
      linkedAthleteAccountCount: mockAthletes.filter(
        (athlete) => athlete.accountConnection.status === "connected"
      ).length,
      publishedWorkoutCount: 0,
      checks: [
        {
          label: "Supabase connection",
          status: "warn",
          detail: "Demo mode is active. Connect a Supabase project before production onboarding."
        },
        {
          label: "Persistence",
          status: "warn",
          detail: "Changes are not saved while demo mode is active."
        }
      ]
    };
  }

  const supabase = await createSupabaseServerClient();
  const [
    athletesResult,
    linkedAthletesResult,
    publishedWorkoutsResult,
    healthCheckResult
  ] = await Promise.all([
    supabase.from("athletes").select("id", { count: "exact", head: true }).eq("managed_by", viewer.id),
    supabase
      .from("athletes")
      .select("id", { count: "exact", head: true })
      .eq("managed_by", viewer.id)
      .eq("athlete_login_status", "connected"),
    supabase
      .from("assigned_workouts")
      .select("id", { count: "exact", head: true })
      .in("athlete_id", viewer.connectedAthleteIds.length > 0 ? viewer.connectedAthleteIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("status", "published"),
    supabase.from("training_weeks").select("id", { count: "exact", head: true }).limit(1)
  ]);

  const athleteCount = athletesResult.count ?? 0;
  const linkedAthleteAccountCount = linkedAthletesResult.count ?? 0;
  const publishedWorkoutCount = publishedWorkoutsResult.count ?? 0;
  const migrationsStatus =
    athletesResult.error || linkedAthletesResult.error || healthCheckResult.error ? "unknown" : "ready";

  return {
    supabaseStatus: isDemoMode() ? "demo" : "configured",
    serviceRoleStatus: isSupabaseServiceRoleConfigured() ? "configured" : "missing",
    migrationsStatus,
    currentRole: viewer.role,
    athleteCount,
    linkedAthleteAccountCount,
    publishedWorkoutCount,
    checks: [
      {
        label: "Supabase connection",
        status: "pass",
        detail: "Public client variables are configured and the app is using authenticated access."
      },
      {
        label: "Migrations",
        status: migrationsStatus === "ready" ? "pass" : "warn",
        detail:
          migrationsStatus === "ready"
            ? "Core athlete and workout tables responded to operational checks."
            : "One or more expected tables did not respond cleanly. Re-run migrations and verify setup."
      },
      {
        label: "Service role",
        status: isSupabaseServiceRoleConfigured() ? "pass" : "warn",
        detail: isSupabaseServiceRoleConfigured()
          ? "Server-side invitation and account-link actions are available."
          : "Add SUPABASE_SERVICE_ROLE_KEY before inviting or linking athlete accounts."
      }
    ]
  };
});
