import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  classifyAthleteProfileCreateError,
  summarizeAthleteProfileValidationIssues
} from "@/lib/athletes/profile-save-errors";

describe("athlete profile create diagnostics", () => {
  it("classifies missing organization context when the database mentions organization_id", () => {
    expect(
      classifyAthleteProfileCreateError({
        code: "23502",
        message: 'null value in column "organization_id" violates not-null constraint'
      })
    ).toBe("missing_organization_context");
  });

  it("classifies missing or incomplete admin identity failures safely", () => {
    expect(
      classifyAthleteProfileCreateError({
        code: "23503",
        message:
          'insert or update on table "athletes" violates foreign key constraint "athletes_managed_by_fkey"',
        details: 'Key (managed_by)=(...) is not present in table "user_profiles".'
      })
    ).toBe("missing_user_profile");

    expect(
      classifyAthleteProfileCreateError({
        code: "42501",
        message: 'new row violates row-level security policy for table "athletes"'
      })
    ).toBe("athlete_create_rls_denied");
  });

  it("classifies required-field and identifier failures", () => {
    expect(
      classifyAthleteProfileCreateError({
        code: "23502",
        message: 'null value in column "first_name" violates not-null constraint'
      })
    ).toBe("athlete_required_field_missing");

    expect(
      classifyAthleteProfileCreateError({
        code: "22P02",
        message: 'invalid input syntax for type uuid: "not-a-uuid"'
      })
    ).toBe("athlete_invalid_identifier");
  });

  it("summarizes validation issues from the athlete form schema", () => {
    const schema = z.object({
      firstName: z.string().min(1, "First name is required."),
      graduationYear: z.number().min(2024, "Graduation year is too low.")
    });

    const parsed = schema.safeParse({
      firstName: "",
      graduationYear: 2020
    });

    expect(parsed.success).toBe(false);

    if (parsed.success) {
      return;
    }

    expect(summarizeAthleteProfileValidationIssues(parsed.error)).toEqual([
      "firstName: First name is required.",
      "graduationYear: Graduation year is too low."
    ]);
  });
});
