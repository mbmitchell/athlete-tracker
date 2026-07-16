import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAthleteUserMetadata,
  buildConnectedState,
  buildDisconnectedState,
  buildInvitationState,
  canManageAthleteAccounts,
  getViewerAccessState,
  validateAthleteAccountLink
} from "@/lib/athletes/account-management";
import { isDemoMode, getSupabasePublicConfigStatus } from "@/lib/env";
import { viewerCanViewAthlete } from "@/lib/workouts/access";
import type { AppViewer } from "@/lib/types/domain";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("athlete account management guards", () => {
  it("blocks non-admins from managing athlete accounts", () => {
    expect(canManageAthleteAccounts({ role: "admin" })).toBe(true);
    expect(canManageAthleteAccounts({ role: "athlete" })).toBe(false);
    expect(canManageAthleteAccounts({ role: "parent" })).toBe(false);
  });

  it("builds an athlete invitation state and assigns the athlete role", () => {
    expect(buildInvitationState("colt@example.com", "user-1", "2026-07-15T20:00:00.000Z")).toEqual({
      athlete_login_status: "invited",
      login_email: "colt@example.com",
      user_id: "user-1",
      invited_at: "2026-07-15T20:00:00.000Z",
      connected_at: null,
      disabled_at: null
    });

    expect(
      buildAthleteUserMetadata({
        athleteId: "athlete-colt",
        fullName: "Colt Ramirez"
      })
    ).toEqual({
      athlete_id: "athlete-colt",
      full_name: "Colt Ramirez",
      role: "athlete"
    });
  });

  it("prevents linking one auth user to multiple athletes", () => {
    expect(
      validateAthleteAccountLink({
        athleteId: "athlete-colt",
        currentAthleteUserId: null,
        existingAthleteIdForUser: "athlete-lane",
        targetUserId: "user-1",
        targetUserRole: "athlete"
      })
    ).toEqual({
      ok: false,
      reason: "user_already_connected_elsewhere"
    });
  });

  it("blocks admin and parent accounts from being connected as athlete logins", () => {
    expect(
      validateAthleteAccountLink({
        athleteId: "athlete-colt",
        currentAthleteUserId: null,
        existingAthleteIdForUser: null,
        targetUserId: "admin-user",
        targetUserRole: "admin"
      })
    ).toEqual({
      ok: false,
      reason: "admin_account_not_allowed"
    });

    expect(
      validateAthleteAccountLink({
        athleteId: "athlete-colt",
        currentAthleteUserId: null,
        existingAthleteIdForUser: null,
        targetUserId: "parent-user",
        targetUserRole: "parent"
      })
    ).toEqual({
      ok: false,
      reason: "parent_account_not_allowed"
    });
  });
});

describe("athlete access state", () => {
  it("marks disabled athlete logins as blocked from protected athlete data", () => {
    const disabledViewer: AppViewer = {
      id: "athlete-user-1",
      email: "colt@example.com",
      displayName: "Colt",
      role: "athlete",
      mode: "authenticated",
      athleteId: null,
      connectedAthleteIds: [],
      accessState: getViewerAccessState({
        role: "athlete",
        athleteStatus: "disabled",
        hasConnectedAthlete: false
      })
    };

    expect(disabledViewer.accessState).toBe("athlete_disabled");
    expect(viewerCanViewAthlete(disabledViewer, "athlete-colt")).toBe(false);
  });

  it("disconnecting a login only clears auth-link fields", () => {
    expect(buildDisconnectedState()).toEqual({
      athlete_login_status: "none",
      login_email: null,
      user_id: null,
      invited_at: null,
      connected_at: null,
      disabled_at: null
    });

    expect(buildConnectedState("lane@example.com", "user-2", "2026-07-15T20:00:00.000Z")).toEqual({
      athlete_login_status: "connected",
      login_email: "lane@example.com",
      user_id: "user-2",
      invited_at: null,
      connected_at: "2026-07-15T20:00:00.000Z",
      disabled_at: null
    });
  });
});

describe("runtime mode and import boundaries", () => {
  it("does not silently activate demo mode when Supabase production config exists", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(getSupabasePublicConfigStatus()).toBe("configured");
    expect(isDemoMode()).toBe(false);
  });

  it("keeps the service-role admin client out of client-side code", () => {
    const workspaceRoot = process.cwd();
    const filesToCheck = collectClientEntryFiles([
      path.join(workspaceRoot, "app"),
      path.join(workspaceRoot, "components"),
      path.join(workspaceRoot, "lib")
    ]);

    for (const file of filesToCheck) {
      const source = fs.readFileSync(file, "utf8");
      expect(source.includes("@/lib/supabase/admin")).toBe(false);
      expect(source.includes("@/lib/athletes/account-links.server")).toBe(false);
    }
  });
});

function collectClientEntryFiles(directories: string[]) {
  return directories.flatMap((directory) => walk(directory)).filter((file) => {
    const source = fs.readFileSync(file, "utf8");
    return source.startsWith('"use client"') || source.startsWith("'use client'");
  });
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
      return [fullPath];
    }

    return [];
  });
}
