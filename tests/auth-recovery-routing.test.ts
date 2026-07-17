import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ATHLETE_ROUTE,
  AUTH_UPDATE_PASSWORD_ROUTE,
  LOGIN_ROUTE,
  resolveProxyRedirect
} from "@/lib/auth/routing";
import {
  getRecoverySuccessRedirectPath,
  getRecoveryUrlDetails,
  resolveRecoveryInitializationState
} from "@/lib/auth/recovery";

describe("auth recovery routing", () => {
  it("signed-out requests can open /auth/update-password", () => {
    expect(
      resolveProxyRedirect({
        pathname: AUTH_UPDATE_PASSWORD_ROUTE,
        hasUser: false
      })
    ).toBeNull();
  });

  it("middleware does not redirect the recovery route", () => {
    expect(
      resolveProxyRedirect({
        pathname: AUTH_UPDATE_PASSWORD_ROUTE,
        hasUser: true
      })
    ).toBeNull();
  });

  it("recovery route does not redirect to /login during initialization", () => {
    expect(
      resolveRecoveryInitializationState({
        hasSession: false,
        hasRecoveryMarkers: true,
        errorDescription: null,
        authEvent: null
      })
    ).toBe("initializing");
  });

  it("login and recovery routes cannot form a redirect loop", () => {
    const loginRedirect = resolveProxyRedirect({
      pathname: LOGIN_ROUTE,
      hasUser: true
    });
    const recoveryRedirect = resolveProxyRedirect({
      pathname: AUTH_UPDATE_PASSWORD_ROUTE,
      hasUser: false
    });

    expect(loginRedirect?.destination).toBe("/");
    expect(recoveryRedirect).toBeNull();
  });

  it("expired links show an error instead of redirecting repeatedly", () => {
    expect(
      resolveRecoveryInitializationState({
        hasSession: false,
        hasRecoveryMarkers: true,
        errorDescription: "Link expired",
        authEvent: null
      })
    ).toBe("invalid_or_expired");
  });

  it("successful password updates route once to /athlete", () => {
    expect(getRecoverySuccessRedirectPath()).toBe(ATHLETE_ROUTE);

    const source = fs.readFileSync(
      path.join(process.cwd(), "components/auth/update-password-form.tsx"),
      "utf8"
    );

    expect(source.includes("router.replace(getRecoverySuccessRedirectPath())")).toBe(true);
  });

  it("parses recovery URL markers without keeping tokens in logs or redirects", () => {
    const url = new URL(
      "https://athlete-tracker-two.vercel.app/auth/update-password#error_description=expired&type=recovery&access_token=abc"
    );

    expect(getRecoveryUrlDetails(url)).toEqual({
      errorDescription: "expired",
      hasRecoveryMarkers: true,
      type: "recovery"
    });
  });
});
