import type { AppViewer, UserRole } from "@/lib/types/domain";
import { getViewerAccessState, normalizeAthleteLoginStatus } from "@/lib/athletes/account-management";
import { getSupabasePublicConfigStatus } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseResult } from "@/lib/supabase/errors";

const demoViewer: AppViewer = {
  id: "demo-admin",
  email: "demo@athletedevelopmenthub.app",
  displayName: "Demo Trainer",
  role: "admin",
  mode: "demo",
  athleteId: null,
  connectedAthleteIds: ["athlete-colt", "athlete-lane"],
  accessState: "active"
};

function coerceRole(value: string | null | undefined): UserRole {
  if (value === "admin" || value === "athlete" || value === "parent") {
    return value;
  }

  return "athlete";
}

export async function getAppViewer(): Promise<AppViewer | null> {
  const configStatus = getSupabasePublicConfigStatus();

  if (configStatus === "missing") {
    return demoViewer;
  }

  if (configStatus === "partial") {
    throw new Error(
      "Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const supabase = await createSupabaseServerClient();
  const authResult = await supabase.auth.getUser();

  if (authResult.error) {
    if (authResult.error.name === "AuthSessionMissingError") {
      return null;
    }

    throw new Error(`Unable to verify Supabase session: ${authResult.error.message}`);
  }

  const user = authResult.data.user;

  if (!user) {
    return null;
  }

  const profile = requireSupabaseResult(
    await supabase
    .from("user_profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle(),
    "Unable to load the signed-in user profile"
  );

  const role = coerceRole(profile?.role ?? user.user_metadata.role);
  let athleteId: string | null = null;
  let connectedAthleteIds: string[] = [];
  let accessState: AppViewer["accessState"] = "active";

  if (role === "athlete") {
    const athlete = requireSupabaseResult(
      await supabase
        .from("athletes")
        .select("id, athlete_login_status")
        .eq("user_id", user.id)
        .maybeSingle(),
      "Unable to load the signed-in athlete profile"
    );

    const athleteStatus = normalizeAthleteLoginStatus(athlete?.athlete_login_status);
    athleteId = athleteStatus === "disabled" ? null : athlete?.id ?? null;
    connectedAthleteIds = athleteId ? [athleteId] : [];
    accessState = getViewerAccessState({
      role,
      athleteStatus,
      hasConnectedAthlete: Boolean(athleteId)
    });
  }

  if (role === "parent") {
    const parentLinks = requireSupabaseResult(
      await supabase
        .from("parent_athletes")
        .select("athlete_id")
        .eq("parent_user_id", user.id),
      "Unable to load parent-athlete links"
    );

    connectedAthleteIds = parentLinks?.map((row) => row.athlete_id) ?? [];
  }

  if (role === "admin") {
    const managedAthletes = requireSupabaseResult(
      await supabase
        .from("athletes")
        .select("id")
        .eq("managed_by", user.id),
      "Unable to load managed athletes"
    );

    connectedAthleteIds = managedAthletes?.map((row) => row.id) ?? [];
  }

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    displayName: profile?.full_name ?? user.user_metadata.full_name ?? "Athlete Development Hub",
    role,
    mode: "authenticated",
    athleteId,
    connectedAthleteIds
    ,
    accessState
  };
}
