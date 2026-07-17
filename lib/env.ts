export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SupabasePublicConfigStatus = "missing" | "partial" | "configured";

const DEFAULT_APP_ORIGIN = "http://localhost:3000";
const LOGIN_PATH = "/login";

export function getSupabasePublicConfigStatus(): SupabasePublicConfigStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return "configured";
  }

  if (!url && !anonKey) {
    return "missing";
  }

  return "partial";
}

export function getSupabaseConfig(): SupabaseConfig | null {
  if (getSupabasePublicConfigStatus() !== "configured") {
    return null;
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfigStatus() === "configured";
}

export function isDemoMode(): boolean {
  return getSupabasePublicConfigStatus() === "missing";
}

export function assertSupabaseConfigured(): SupabaseConfig {
  const config = getSupabaseConfig();
  const status = getSupabasePublicConfigStatus();

  if (config) {
    return config;
  }

  if (status === "partial") {
    throw new Error(
      "Supabase configuration is incomplete. Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  throw new Error("Supabase is not configured.");
}

export function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseServiceRoleKey());
}

export function assertSupabaseServiceRoleKey(): string {
  const key = getSupabaseServiceRoleKey();

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for athlete invitations and account linking."
    );
  }

  return key;
}

function parseAppUrlCandidate(value: string, defaultProtocol: string): URL {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("App URL cannot be empty.");
  }

  const normalizedValue = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `${defaultProtocol}//${trimmed.replace(/^\/+/, "")}`;

  try {
    return new URL(normalizedValue);
  } catch {
    throw new Error(`Invalid app URL: ${value}`);
  }
}

export function normalizeAppOrigin(value: string): string {
  return parseAppUrlCandidate(value, "https:").origin;
}

function getConfiguredProductionOrigin(): string | null {
  const configuredProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (!configuredProductionUrl) {
    return null;
  }

  return normalizeAppOrigin(configuredProductionUrl);
}

function isVercelPreviewOrigin(currentOrigin: string, productionOrigin: string): boolean {
  const currentHost = new URL(currentOrigin).hostname;
  const productionHost = new URL(productionOrigin).hostname;

  return currentHost.endsWith(".vercel.app") && currentHost !== productionHost;
}

export function getAppOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim()
    ? normalizeAppOrigin(process.env.NEXT_PUBLIC_APP_URL)
    : DEFAULT_APP_ORIGIN;
  const productionOrigin = getConfiguredProductionOrigin();

  if (process.env.VERCEL_ENV === "production" && productionOrigin && isVercelPreviewOrigin(configuredOrigin, productionOrigin)) {
    return productionOrigin;
  }

  return configuredOrigin;
}

export function getAthleteInvitationRedirectUrl(): string {
  return new URL(LOGIN_PATH, `${getAppOrigin()}/`).toString();
}

export function getAppUrl(): string {
  return getAppOrigin();
}
