import type { ZodError } from "zod";

export type AthleteProfileCreateErrorCode =
  | "invalid_athlete_profile"
  | "athlete_required_field_missing"
  | "missing_organization_context"
  | "missing_user_profile"
  | "incomplete_user_profile"
  | "admin_role_mismatch"
  | "athlete_create_rls_denied"
  | "athlete_invalid_identifier"
  | "create_failed";

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

export function summarizeAthleteProfileValidationIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

export function classifyAthleteProfileCreateError(
  error: SupabaseLikeError
): AthleteProfileCreateErrorCode {
  const combined = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (combined.includes("organization_id")) {
    return "missing_organization_context";
  }

  if (
    error.code === "42501" ||
    combined.includes("row-level security") ||
    combined.includes("permission denied")
  ) {
    return "athlete_create_rls_denied";
  }

  if (
    error.code === "23503" &&
    (combined.includes("user_profiles") ||
      combined.includes("managed_by") ||
      combined.includes("athletes_managed_by_fkey"))
  ) {
    return "missing_user_profile";
  }

  if (error.code === "23502" || combined.includes("null value in column")) {
    return "athlete_required_field_missing";
  }

  if (
    error.code === "22p02" ||
    combined.includes("invalid input syntax for type uuid") ||
    combined.includes("invalid input value for enum")
  ) {
    return "athlete_invalid_identifier";
  }

  return "create_failed";
}
