"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  AthleteAccountActionError,
  connectExistingAthleteAccount,
  disableAthleteAccount,
  disconnectAthleteAccount,
  inviteAthleteAccount,
  resendAthleteInvitation
} from "@/lib/athletes/account-links.server";
import { canManageAthleteAccounts } from "@/lib/athletes/account-management";
import {
  classifyAthleteProfileCreateError,
  summarizeAthleteProfileValidationIssues,
  type AthleteProfileCreateErrorCode
} from "@/lib/athletes/profile-save-errors";
import { getAppViewer } from "@/lib/auth/session";
import { getSupabaseConfig, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { athleteProfileSchema } from "@/lib/validation/athlete";

const athleteAccountEmailSchema = z.object({
  athleteId: z.string().min(1),
  email: z.email().transform((value) => value.trim().toLowerCase())
});

function ensureAdminViewer(viewer: Awaited<ReturnType<typeof getAppViewer>>) {
  if (!viewer) {
    redirect("/login");
  }

  if (!canManageAthleteAccounts(viewer)) {
    redirect("/athlete");
  }

  return viewer;
}

function revalidateAthleteAccountPaths(athleteId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/setup");
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${athleteId}/edit`);
}

function redirectToAthleteAccountResult(athleteId: string, query: string) {
  redirect(`/athletes/${athleteId}/edit?${query}`);
}

function getAthleteAccountErrorCode(error: unknown): string {
  if (error instanceof AthleteAccountActionError) {
    return error.code;
  }

  return "account_action_failed";
}

function ensureAccountMutationsConfigured(athleteId: string) {
  if (!getSupabaseConfig()) {
    redirectToAthleteAccountResult(athleteId, "status=demo_mode");
  }

  if (!isSupabaseServiceRoleConfigured()) {
    redirectToAthleteAccountResult(athleteId, "error=service_role_missing");
  }
}

function redirectToAthleteCreateError(errorCode: AthleteProfileCreateErrorCode): never {
  return redirect(`/athletes/new?error=${encodeURIComponent(errorCode)}`);
}

function logAthleteCreateFailure(params: {
  viewerId: string;
  viewerRole: string;
  errorCode: AthleteProfileCreateErrorCode;
  supabaseError?: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  };
  validationIssues?: string[];
  payload?: Record<string, unknown>;
}) {
  console.error("Athlete create failed", {
    viewerId: params.viewerId,
    viewerRole: params.viewerRole,
    errorCode: params.errorCode,
    validationIssues: params.validationIssues,
    payload: params.payload,
    supabaseError: params.supabaseError
  });
}

export async function saveAthleteProfileAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const parsed = athleteProfileSchema.safeParse({
    athleteId: formData.get("athleteId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    graduationYear: formData.get("graduationYear"),
    dateOfBirth: formData.get("dateOfBirth"),
    hometown: formData.get("hometown"),
    primaryPosition: formData.get("primaryPosition"),
    secondaryPosition: formData.get("secondaryPosition"),
    height: formData.get("height"),
    weight: formData.get("weight"),
    currentTeam: formData.get("currentTeam"),
    developmentGoals: formData.get("developmentGoals"),
    availableEquipment: formData.get("availableEquipment"),
    restrictionsOrInjuryNotes: formData.get("restrictionsOrInjuryNotes"),
    recruitingNotes: formData.get("recruitingNotes"),
    currentDevelopmentFocus: formData.get("currentDevelopmentFocus"),
    activeStatus: formData.get("activeStatus")
  });

  if (!parsed.success) {
    const validationIssues = summarizeAthleteProfileValidationIssues(parsed.error);
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode: "invalid_athlete_profile",
      validationIssues
    });

    redirectToAthleteCreateError("invalid_athlete_profile");
  }

  if (!getSupabaseConfig()) {
    redirect("/athletes?status=demo_mode");
  }

  const supabase = await createSupabaseServerClient();
  const input = parsed.data;

  const payload = {
    managed_by: viewer.id,
    first_name: input.firstName,
    last_name: input.lastName,
    graduation_year: input.graduationYear,
    date_of_birth: input.dateOfBirth,
    hometown: input.hometown,
    primary_position: input.primaryPosition,
    secondary_position: input.secondaryPosition,
    height: input.height,
    weight: input.weight,
    current_team: input.currentTeam,
    development_goals: input.developmentGoals,
    available_equipment: input.availableEquipment,
    restrictions_or_injury_notes: input.restrictionsOrInjuryNotes,
    recruiting_notes: input.recruitingNotes,
    current_development_focus: input.currentDevelopmentFocus,
    active: input.activeStatus === "active"
  };

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, role")
    .eq("id", viewer.id)
    .maybeSingle();

  if (profileError) {
    const errorCode = classifyAthleteProfileCreateError(profileError);
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode,
      payload: {
        managedBy: payload.managed_by,
        graduationYear: payload.graduation_year
      },
      supabaseError: {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      }
    });

    redirectToAthleteCreateError(errorCode);
  }

  if (!profile) {
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode: "missing_user_profile",
      payload: {
        managedBy: payload.managed_by,
        graduationYear: payload.graduation_year
      }
    });

    redirectToAthleteCreateError("missing_user_profile");
  }

  const resolvedProfile = profile;

  if (!resolvedProfile.email || !resolvedProfile.role) {
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode: "incomplete_user_profile",
      payload: {
        managedBy: payload.managed_by,
        graduationYear: payload.graduation_year
      }
    });

    redirectToAthleteCreateError("incomplete_user_profile");
  }

  if (resolvedProfile.role !== "admin") {
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode: "admin_role_mismatch",
      payload: {
        managedBy: payload.managed_by,
        profileRole: resolvedProfile.role,
        graduationYear: payload.graduation_year
      }
    });

    redirectToAthleteCreateError("admin_role_mismatch");
  }

  if (input.athleteId) {
    const { error } = await supabase.from("athletes").update(payload).eq("id", input.athleteId);

    if (error) {
      redirect(`/athletes/${input.athleteId}/edit?error=save_failed`);
    }

    revalidateAthleteAccountPaths(input.athleteId);
    redirect(`/athletes/${input.athleteId}/edit?status=saved`);
  }

  const { data, error } = await supabase.from("athletes").insert(payload).select("id").single();

  if (error || !data) {
    const errorCode = error ? classifyAthleteProfileCreateError(error) : "create_failed";
    logAthleteCreateFailure({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      errorCode,
      payload: {
        managedBy: payload.managed_by,
        profileRole: resolvedProfile.role,
        graduationYear: payload.graduation_year,
        hasDateOfBirth: Boolean(payload.date_of_birth),
        active: payload.active
      },
      supabaseError: error
        ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        : undefined
    });

    redirectToAthleteCreateError(errorCode);
  }

  const createdAthlete = data;

  revalidatePath("/admin");
  revalidatePath("/admin/setup");
  revalidatePath("/athletes");
  redirect(`/athletes/${createdAthlete.id}/edit?status=created`);
}

export async function inviteAthleteAccountAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const parsed = athleteAccountEmailSchema.safeParse({
    athleteId: formData.get("athleteId"),
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/athletes?error=invalid_athlete_account_email");
  }

  ensureAccountMutationsConfigured(parsed.data.athleteId);

  try {
    await inviteAthleteAccount({
      viewerId: viewer.id,
      athleteId: parsed.data.athleteId,
      email: parsed.data.email
    });
  } catch (error) {
    redirectToAthleteAccountResult(
      parsed.data.athleteId,
      `error=${encodeURIComponent(getAthleteAccountErrorCode(error))}`
    );
  }

  revalidateAthleteAccountPaths(parsed.data.athleteId);
  redirectToAthleteAccountResult(parsed.data.athleteId, "status=invited");
}

export async function connectExistingAthleteAccountAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const parsed = athleteAccountEmailSchema.safeParse({
    athleteId: formData.get("athleteId"),
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/athletes?error=invalid_athlete_account_email");
  }

  ensureAccountMutationsConfigured(parsed.data.athleteId);

  try {
    await connectExistingAthleteAccount({
      viewerId: viewer.id,
      athleteId: parsed.data.athleteId,
      email: parsed.data.email
    });
  } catch (error) {
    redirectToAthleteAccountResult(
      parsed.data.athleteId,
      `error=${encodeURIComponent(getAthleteAccountErrorCode(error))}`
    );
  }

  revalidateAthleteAccountPaths(parsed.data.athleteId);
  redirectToAthleteAccountResult(parsed.data.athleteId, "status=connected");
}

export async function resendAthleteInvitationAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const athleteId = String(formData.get("athleteId") ?? "");

  if (!athleteId) {
    redirect("/athletes?error=missing_athlete");
  }

  ensureAccountMutationsConfigured(athleteId);

  try {
    await resendAthleteInvitation({
      viewerId: viewer.id,
      athleteId
    });
  } catch (error) {
    redirectToAthleteAccountResult(athleteId, `error=${encodeURIComponent(getAthleteAccountErrorCode(error))}`);
  }

  revalidateAthleteAccountPaths(athleteId);
  redirectToAthleteAccountResult(athleteId, "status=invitation_resent");
}

export async function disableAthleteAccountAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const athleteId = String(formData.get("athleteId") ?? "");

  if (!athleteId) {
    redirect("/athletes?error=missing_athlete");
  }

  ensureAccountMutationsConfigured(athleteId);

  try {
    await disableAthleteAccount({
      viewerId: viewer.id,
      athleteId
    });
  } catch (error) {
    redirectToAthleteAccountResult(athleteId, `error=${encodeURIComponent(getAthleteAccountErrorCode(error))}`);
  }

  revalidateAthleteAccountPaths(athleteId);
  redirectToAthleteAccountResult(athleteId, "status=login_disabled");
}

export async function disconnectAthleteAccountAction(formData: FormData) {
  const viewer = ensureAdminViewer(await getAppViewer());
  const athleteId = String(formData.get("athleteId") ?? "");

  if (!athleteId) {
    redirect("/athletes?error=missing_athlete");
  }

  ensureAccountMutationsConfigured(athleteId);

  try {
    await disconnectAthleteAccount({
      viewerId: viewer.id,
      athleteId
    });
  } catch (error) {
    redirectToAthleteAccountResult(athleteId, `error=${encodeURIComponent(getAthleteAccountErrorCode(error))}`);
  }

  revalidateAthleteAccountPaths(athleteId);
  redirectToAthleteAccountResult(athleteId, "status=login_disconnected");
}
