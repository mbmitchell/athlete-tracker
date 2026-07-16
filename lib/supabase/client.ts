"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { assertSupabaseConfigured } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const config = assertSupabaseConfigured();

  return createBrowserClient<Database>(config.url, config.anonKey);
}
