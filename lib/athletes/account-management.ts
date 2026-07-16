import type {
  AppViewer,
  AthleteAccountConnection,
  AthleteLoginStatus,
  UserRole
} from "@/lib/types/domain";

type AthleteAccountTransition = {
  athlete_login_status: AthleteLoginStatus;
  login_email: string | null;
  user_id: string | null;
  invited_at: string | null;
  connected_at: string | null;
  disabled_at: string | null;
};

type ValidateLinkOptions = {
  athleteId: string;
  currentAthleteUserId: string | null;
  existingAthleteIdForUser: string | null;
  targetUserId: string;
  targetUserRole: UserRole | null;
};

export function canManageAthleteAccounts(viewer: Pick<AppViewer, "role"> | null): boolean {
  return viewer?.role === "admin";
}

export function normalizeAthleteLoginStatus(value: string | null | undefined): AthleteLoginStatus {
  if (value === "invited" || value === "connected" || value === "disabled") {
    return value;
  }

  return "none";
}

export function buildInvitationState(
  email: string,
  userId: string,
  nowIso: string
): AthleteAccountTransition {
  return {
    athlete_login_status: "invited",
    login_email: email,
    user_id: userId,
    invited_at: nowIso,
    connected_at: null,
    disabled_at: null
  };
}

export function buildConnectedState(
  email: string,
  userId: string,
  nowIso: string
): AthleteAccountTransition {
  return {
    athlete_login_status: "connected",
    login_email: email,
    user_id: userId,
    invited_at: null,
    connected_at: nowIso,
    disabled_at: null
  };
}

export function buildDisabledState(current: AthleteAccountConnection, nowIso: string): AthleteAccountTransition {
  return {
    athlete_login_status: "disabled",
    login_email: current.email || null,
    user_id: current.userId,
    invited_at: current.invitedAt,
    connected_at: current.connectedAt,
    disabled_at: nowIso
  };
}

export function buildDisconnectedState(): AthleteAccountTransition {
  return {
    athlete_login_status: "none",
    login_email: null,
    user_id: null,
    invited_at: null,
    connected_at: null,
    disabled_at: null
  };
}

export function buildAthleteUserMetadata(params: {
  athleteId: string;
  fullName: string;
}): { athlete_id: string; full_name: string; role: "athlete" } {
  return {
    athlete_id: params.athleteId,
    full_name: params.fullName,
    role: "athlete"
  };
}

export function validateAthleteAccountLink(options: ValidateLinkOptions):
  | { ok: true }
  | { ok: false; reason: string } {
  if (options.targetUserRole === "admin") {
    return { ok: false, reason: "admin_account_not_allowed" };
  }

  if (options.targetUserRole === "parent") {
    return { ok: false, reason: "parent_account_not_allowed" };
  }

  if (
    options.existingAthleteIdForUser &&
    options.existingAthleteIdForUser !== options.athleteId
  ) {
    return { ok: false, reason: "user_already_connected_elsewhere" };
  }

  if (
    options.currentAthleteUserId &&
    options.currentAthleteUserId !== options.targetUserId
  ) {
    return { ok: false, reason: "athlete_already_has_different_login" };
  }

  return { ok: true };
}

export function getViewerAccessState(params: {
  role: UserRole;
  athleteStatus?: AthleteLoginStatus | null;
  hasConnectedAthlete: boolean;
}): AppViewer["accessState"] {
  if (params.role !== "athlete") {
    return "active";
  }

  if (params.athleteStatus === "disabled") {
    return "athlete_disabled";
  }

  if (!params.hasConnectedAthlete) {
    return "athlete_unlinked";
  }

  return "active";
}
