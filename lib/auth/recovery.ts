import { ATHLETE_ROUTE } from "@/lib/auth/routing";

export type RecoveryInitializationState =
  | "initializing"
  | "ready"
  | "invalid_or_expired";

export type RecoveryAuthEvent = "PASSWORD_RECOVERY" | "SIGNED_IN" | null;

export function getRecoverySuccessRedirectPath() {
  return ATHLETE_ROUTE;
}

export function getRecoveryUrlDetails(url: URL) {
  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const errorDescription =
    searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    searchParams.get("error") ??
    hashParams.get("error");
  const type = searchParams.get("type") ?? hashParams.get("type");
  const hasRecoveryMarkers =
    Boolean(searchParams.get("code")) ||
    Boolean(searchParams.get("token_hash")) ||
    Boolean(hashParams.get("access_token")) ||
    Boolean(hashParams.get("refresh_token")) ||
    Boolean(type === "recovery");

  return {
    errorDescription,
    hasRecoveryMarkers,
    type
  };
}

export function resolveRecoveryInitializationState(params: {
  hasSession: boolean;
  hasRecoveryMarkers: boolean;
  errorDescription?: string | null;
  authEvent: RecoveryAuthEvent;
}): RecoveryInitializationState {
  if (params.errorDescription) {
    return "invalid_or_expired";
  }

  if (params.hasSession || params.authEvent === "PASSWORD_RECOVERY" || params.authEvent === "SIGNED_IN") {
    return "ready";
  }

  if (params.hasRecoveryMarkers) {
    return "initializing";
  }

  return "invalid_or_expired";
}
