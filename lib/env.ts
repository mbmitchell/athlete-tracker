export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type SupabasePublicConfigStatus = "missing" | "partial" | "configured";

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

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
