import "server-only";

import { createClient } from "@supabase/supabase-js";

import { assertSupabaseConfigured, assertSupabaseServiceRoleKey } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export function createSupabaseAdminClient() {
  const config = assertSupabaseConfigured();
  const serviceRoleKey = assertSupabaseServiceRoleKey();

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
