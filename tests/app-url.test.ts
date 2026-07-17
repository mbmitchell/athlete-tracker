import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppOrigin, getAthleteInvitationRedirectUrl, normalizeAppOrigin } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("app URL normalization", () => {
  it("trims whitespace and treats the configured app URL as the site origin only", () => {
    expect(normalizeAppOrigin("  https://athlete-tracker-two.vercel.app/login/  ")).toBe(
      "https://athlete-tracker-two.vercel.app"
    );
  });

  it("builds one login redirect when the base URL has no trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://athlete-tracker-two.vercel.app");

    expect(getAthleteInvitationRedirectUrl()).toBe("https://athlete-tracker-two.vercel.app/login");
  });

  it("builds one login redirect when the base URL has a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://athlete-tracker-two.vercel.app/");

    expect(getAthleteInvitationRedirectUrl()).toBe("https://athlete-tracker-two.vercel.app/login");
  });

  it("does not build /login/login when the base URL accidentally ends in /login", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://athlete-tracker-two.vercel.app/login");

    expect(getAthleteInvitationRedirectUrl()).toBe("https://athlete-tracker-two.vercel.app/login");
  });

  it("never points production redirects at a Vercel preview deployment", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "athlete-tracker-two.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://athlete-tracker-git-fix-invite-abc123.vercel.app/login");

    expect(getAppOrigin()).toBe("https://athlete-tracker-two.vercel.app");
    expect(getAthleteInvitationRedirectUrl()).toBe("https://athlete-tracker-two.vercel.app/login");
  });
});

describe("athlete invitation redirect wiring", () => {
  it("uses the same normalized redirect flow for invite and resend", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/athletes/account-links.server.ts"),
      "utf8"
    );

    expect(source.match(/await sendAthleteAccountEmail\(/g)?.length ?? 0).toBe(2);
    expect(source.includes("redirectTo: getAthleteInvitationRedirectUrl()")).toBe(true);
    expect(source.includes('redirectTo: `${getAppUrl()}/login`')).toBe(false);
  });
});
