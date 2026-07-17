export const LOGIN_ROUTE = "/login";
export const ROOT_ROUTE = "/";
export const AUTH_UPDATE_PASSWORD_ROUTE = "/auth/update-password";
export const AUTH_CALLBACK_ROUTE = "/auth/callback";
export const ATHLETE_ROUTE = "/athlete";

const protectedPrefixes = ["/admin", "/athlete", "/athletes", "/calendar", "/workouts"];
const publicAuthRoutes = new Set([ROOT_ROUTE, LOGIN_ROUTE, AUTH_UPDATE_PASSWORD_ROUTE, AUTH_CALLBACK_ROUTE]);
const publicAssetRoutes = new Set([
  "/manifest.webmanifest",
  "/sw.js",
  "/icon",
  "/apple-icon"
]);
const publicAssetPrefixes = ["/pwa-icons/"];

export type AuthStateCategory =
  | "authenticated"
  | "signed_out"
  | "signed_out_protected"
  | "authenticated_login"
  | "public_recovery_route"
  | "public_route"
  | "public_asset";

export function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicAssetPath(pathname: string): boolean {
  return publicAssetRoutes.has(pathname) || publicAssetPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function isPublicAuthPath(pathname: string): boolean {
  return publicAuthRoutes.has(pathname);
}

export function resolveProxyRedirect(params: {
  pathname: string;
  hasUser: boolean;
}): {
  destination: string;
  authStateCategory: AuthStateCategory;
} | null {
  if (params.pathname === AUTH_UPDATE_PASSWORD_ROUTE || params.pathname === AUTH_CALLBACK_ROUTE) {
    return null;
  }

  if (params.hasUser && params.pathname === LOGIN_ROUTE) {
    return {
      destination: ROOT_ROUTE,
      authStateCategory: "authenticated_login"
    };
  }

  if (!params.hasUser && isProtectedPath(params.pathname)) {
    return {
      destination: `${LOGIN_ROUTE}?redirectTo=${encodeURIComponent(params.pathname)}`,
      authStateCategory: "signed_out_protected"
    };
  }

  return null;
}
