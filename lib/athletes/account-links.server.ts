import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  type AthleteAuthEmailDeliveryMethod,
  buildAthleteUserMetadata,
  buildConnectedState,
  buildDisabledState,
  buildDisconnectedState,
  buildInvitationState,
  normalizeAthleteLoginStatus,
  planAthleteAuthEmailDelivery,
  validateAthleteAccountLink
} from "@/lib/athletes/account-management";
import { getAthleteInvitationRedirectUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireSupabaseResult } from "@/lib/supabase/errors";

type ManagedAthleteAccountRow = {
  id: string;
  managed_by: string;
  user_id: string | null;
  athlete_login_status: string | null;
  login_email: string | null;
  invited_at: string | null;
  connected_at: string | null;
  disabled_at: string | null;
  first_name: string;
  last_name: string;
};

export class AthleteAccountActionError extends Error {
  code: string;

  constructor(code: string, message = code) {
    super(message);
    this.code = code;
  }
}

function fail(code: string, message?: string): never {
  throw new AthleteAccountActionError(code, message);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function getManagedAthleteAccount(
  viewerId: string,
  athleteId: string
): Promise<ManagedAthleteAccountRow> {
  const admin = createSupabaseAdminClient();
  const athlete = requireSupabaseResult(
    await admin
      .from("athletes")
      .select(
        "id, managed_by, user_id, athlete_login_status, login_email, invited_at, connected_at, disabled_at, first_name, last_name"
      )
      .eq("id", athleteId)
      .eq("managed_by", viewerId)
      .maybeSingle(),
    "Unable to load athlete account state"
  );

  if (!athlete) {
    fail("athlete_not_found");
  }

  return athlete;
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(email);
  let page = 1;
  const perPage = 200;

  while (true) {
    const result = await admin.auth.admin.listUsers({ page, perPage });

    if (result.error) {
      throw new Error(`Unable to list Supabase auth users: ${result.error.message}`);
    }

    const match =
      result.data.users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail) ?? null;

    if (match) {
      return match;
    }

    if (!result.data.nextPage) {
      return null;
    }

    page = result.data.nextPage;
  }
}

async function getAuthUserById(userId: string): Promise<User | null> {
  const admin = createSupabaseAdminClient();
  const result = await admin.auth.admin.getUserById(userId);

  if (result.error) {
    throw new Error(`Unable to load Supabase auth user: ${result.error.message}`);
  }

  return result.data.user ?? null;
}

async function getUserRole(userId: string): Promise<"admin" | "athlete" | "parent" | null> {
  const admin = createSupabaseAdminClient();
  const profile = requireSupabaseResult(
    await admin.from("user_profiles").select("role").eq("id", userId).maybeSingle(),
    "Unable to load auth user role"
  );

  return profile?.role ?? null;
}

async function getAthleteIdForLinkedUser(userId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const linkedAthlete = requireSupabaseResult(
    await admin.from("athletes").select("id").eq("user_id", userId).maybeSingle(),
    "Unable to verify existing athlete login linkage"
  );

  return linkedAthlete?.id ?? null;
}

async function upsertAthleteProfileRole(params: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("user_profiles").upsert(
    {
      id: params.userId,
      email: params.email,
      full_name: params.fullName,
      role: "athlete"
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(`Unable to assign the athlete role: ${error.message}`);
  }
}

async function attachAthleteMetadata(user: User, athleteId: string, fullName: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    ban_duration: "none",
    user_metadata: {
      ...(user.user_metadata ?? {}),
      ...buildAthleteUserMetadata({
        athleteId,
        fullName
      })
    }
  });

  if (error) {
    throw new Error(`Unable to update athlete auth metadata: ${error.message}`);
  }
}

function buildAthleteInviteOptions(athleteId: string, fullName: string) {
  return {
    data: buildAthleteUserMetadata({
      athleteId,
      fullName
    }),
    redirectTo: getAthleteInvitationRedirectUrl()
  };
}

function logAthleteAuthEmailFailure(params: {
  athleteId: string;
  email: string;
  method: AthleteAuthEmailDeliveryMethod;
  error: {
    code?: string;
    message: string;
    status?: number;
  };
}) {
  console.error("[athlete-account] auth email delivery failed", {
    athleteId: params.athleteId,
    email: params.email,
    method: params.method,
    code: params.error.code,
    message: params.error.message,
    status: params.error.status
  });
}

async function getValidatedAthleteAuthUser(athlete: ManagedAthleteAccountRow): Promise<User> {
  if (!athlete.user_id) {
    fail("user_not_found");
  }

  const authUser = await getAuthUserById(athlete.user_id);

  if (!authUser?.id || !authUser.email) {
    fail("user_not_found");
  }

  const validation = validateAthleteAccountLink({
    athleteId: athlete.id,
    currentAthleteUserId: athlete.user_id,
    existingAthleteIdForUser: await getAthleteIdForLinkedUser(authUser.id),
    targetUserId: authUser.id,
    targetUserRole: await getUserRole(authUser.id)
  });

  if (!validation.ok) {
    fail(validation.reason);
  }

  return authUser;
}

async function sendAthleteAccountEmail(params: {
  email: string;
  athleteId: string;
  fullName: string;
  athleteStatus: "none" | "invited" | "connected";
  authUser?: User | null;
}) {
  const admin = createSupabaseAdminClient();
  const inviteOptions = buildAthleteInviteOptions(params.athleteId, params.fullName);
  const deliveryPlan = planAthleteAuthEmailDelivery({
    athleteStatus: params.athleteStatus,
    hasExistingAuthUser: Boolean(params.authUser)
  });

  if (!deliveryPlan) {
    fail("account_action_failed");
  }

  console.info("[athlete-account] auth email redirect URL", {
    athleteId: params.athleteId,
    method: deliveryPlan.method,
    redirectTo: inviteOptions.redirectTo
  });

  if (deliveryPlan.method === "inviteUserByEmail") {
    return admin.auth.admin.inviteUserByEmail(params.email, inviteOptions);
  }

  const recoveryEmail = normalizeEmail(params.authUser?.email ?? params.email);
  const result = await admin.auth.resetPasswordForEmail(recoveryEmail, {
    redirectTo: inviteOptions.redirectTo
  });

  if (result.error) {
    logAthleteAuthEmailFailure({
      athleteId: params.athleteId,
      email: recoveryEmail,
      method: deliveryPlan.method,
      error: {
        code: "code" in result.error ? result.error.code : undefined,
        message: result.error.message,
        status: "status" in result.error ? result.error.status : undefined
      }
    });
  }

  return result;
}

export async function inviteAthleteAccount(params: {
  viewerId: string;
  athleteId: string;
  email: string;
}) {
  const athlete = await getManagedAthleteAccount(params.viewerId, params.athleteId);
  const admin = createSupabaseAdminClient();
  const email = normalizeEmail(params.email);

  if (athlete.user_id && normalizeAthleteLoginStatus(athlete.athlete_login_status) !== "none") {
    fail("athlete_already_has_login");
  }

  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    fail("existing_user_use_connect");
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  const inviteResult = await sendAthleteAccountEmail({
    email,
    athleteId: athlete.id,
    fullName,
    athleteStatus: "none"
  });

  if (inviteResult.error) {
    logAthleteAuthEmailFailure({
      athleteId: athlete.id,
      email,
      method: "inviteUserByEmail",
      error: {
        code: "code" in inviteResult.error ? inviteResult.error.code : undefined,
        message: inviteResult.error.message,
        status: "status" in inviteResult.error ? inviteResult.error.status : undefined
      }
    });
    fail("invite_failed", inviteResult.error.message);
  }

  let invitedUser: User | null = null;

  if ("user" in inviteResult.data) {
    invitedUser = inviteResult.data.user as User | null;
  }

  if (!invitedUser?.id) {
    invitedUser = await findAuthUserByEmail(email);
  }

  if (!invitedUser?.id) {
    fail("invite_failed");
  }

  await upsertAthleteProfileRole({
    userId: invitedUser.id,
    email,
    fullName
  });

  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from("athletes")
    .update(buildInvitationState(email, invitedUser.id, nowIso))
    .eq("id", athlete.id)
    .eq("managed_by", params.viewerId);

  if (error) {
    throw new Error(`Unable to save the athlete invitation state: ${error.message}`);
  }
}

export async function resendAthleteInvitation(params: {
  viewerId: string;
  athleteId: string;
}) {
  const athlete = await getManagedAthleteAccount(params.viewerId, params.athleteId);
  const athleteStatus = normalizeAthleteLoginStatus(athlete.athlete_login_status);

  if ((athleteStatus !== "invited" && athleteStatus !== "connected") || !athlete.user_id) {
    fail("invite_not_pending");
  }

  const authUser = await getValidatedAthleteAuthUser(athlete);
  const email = normalizeEmail(authUser.email ?? athlete.login_email ?? "");

  if (!email) {
    fail("user_not_found");
  }

  await upsertAthleteProfileRole({
    userId: authUser.id,
    email,
    fullName: `${athlete.first_name} ${athlete.last_name}`
  });
  await attachAthleteMetadata(authUser, athlete.id, `${athlete.first_name} ${athlete.last_name}`);

  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  const result = await sendAthleteAccountEmail({
    email,
    athleteId: athlete.id,
    fullName,
    athleteStatus,
    authUser
  });

  if (result.error) {
    fail("invite_failed", result.error.message);
  }

  if (athleteStatus === "invited") {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("athletes")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", athlete.id)
      .eq("managed_by", params.viewerId);

    if (error) {
      throw new Error(`Unable to refresh the invitation timestamp: ${error.message}`);
    }
  }
}

export async function connectExistingAthleteAccount(params: {
  viewerId: string;
  athleteId: string;
  email: string;
}) {
  const athlete = await getManagedAthleteAccount(params.viewerId, params.athleteId);
  const email = normalizeEmail(params.email);
  const authUser = await findAuthUserByEmail(email);

  if (!authUser?.id || !authUser.email) {
    fail("user_not_found");
  }

  const validation = validateAthleteAccountLink({
    athleteId: athlete.id,
    currentAthleteUserId: athlete.user_id,
    existingAthleteIdForUser: await getAthleteIdForLinkedUser(authUser.id),
    targetUserId: authUser.id,
    targetUserRole: await getUserRole(authUser.id)
  });

  if (!validation.ok) {
    fail(validation.reason);
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  await upsertAthleteProfileRole({
    userId: authUser.id,
    email: authUser.email,
    fullName
  });
  await attachAthleteMetadata(authUser, athlete.id, fullName);

  const nowIso = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("athletes")
    .update(buildConnectedState(authUser.email, authUser.id, nowIso))
    .eq("id", athlete.id)
    .eq("managed_by", params.viewerId);

  if (error) {
    throw new Error(`Unable to save the athlete login connection: ${error.message}`);
  }
}

export async function disableAthleteAccount(params: {
  viewerId: string;
  athleteId: string;
}) {
  const athlete = await getManagedAthleteAccount(params.viewerId, params.athleteId);
  const status = normalizeAthleteLoginStatus(athlete.athlete_login_status);

  if (!athlete.user_id || (status !== "connected" && status !== "invited")) {
    fail("disable_requires_connected_login");
  }

  const admin = createSupabaseAdminClient();
  const disableAuthResult = await admin.auth.admin.updateUserById(athlete.user_id, {
    ban_duration: "876000h"
  });

  if (disableAuthResult.error) {
    fail("disable_failed", disableAuthResult.error.message);
  }

  const { error } = await admin
    .from("athletes")
    .update(
      buildDisabledState(
        {
          status,
          email: athlete.login_email ?? "",
          userId: athlete.user_id,
          invitedAt: athlete.invited_at,
          connectedAt: athlete.connected_at,
          disabledAt: athlete.disabled_at
        },
        new Date().toISOString()
      )
    )
    .eq("id", athlete.id)
    .eq("managed_by", params.viewerId);

  if (error) {
    throw new Error(`Unable to disable the athlete login: ${error.message}`);
  }
}

export async function disconnectAthleteAccount(params: {
  viewerId: string;
  athleteId: string;
}) {
  const athlete = await getManagedAthleteAccount(params.viewerId, params.athleteId);

  if (!athlete.user_id && normalizeAthleteLoginStatus(athlete.athlete_login_status) === "none") {
    fail("disconnect_requires_login");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("athletes")
    .update(buildDisconnectedState())
    .eq("id", athlete.id)
    .eq("managed_by", params.viewerId);

  if (error) {
    throw new Error(`Unable to disconnect the athlete login: ${error.message}`);
  }
}

export async function finalizeAthleteAccountAfterSignIn(userId: string) {
  const admin = createSupabaseAdminClient();
  const athlete = requireSupabaseResult(
    await admin
      .from("athletes")
      .select(
        "id, user_id, athlete_login_status, login_email, invited_at, connected_at, disabled_at, first_name, last_name"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    "Unable to finalize athlete sign-in state"
  );

  if (!athlete || normalizeAthleteLoginStatus(athlete.athlete_login_status) !== "invited") {
    return;
  }

  const userResult = await admin.auth.admin.getUserById(userId);

  if (userResult.error || !userResult.data.user?.email) {
    throw new Error(
      `Unable to confirm the invited athlete account: ${userResult.error?.message ?? "missing user"}`
    );
  }

  const { error } = await admin
    .from("athletes")
    .update(buildConnectedState(userResult.data.user.email, userId, new Date().toISOString()))
    .eq("id", athlete.id);

  if (error) {
    throw new Error(`Unable to finalize the athlete connection: ${error.message}`);
  }
}
