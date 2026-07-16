"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { getAppViewer } from "@/lib/auth/session";
import { resolveDefaultPathForRole } from "@/lib/auth/roles";

export async function signInAction(formData: FormData) {
  const config = getSupabaseConfig();

  if (!config) {
    redirect("/admin");
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  const viewer = await getAppViewer();
  const destination = redirectTo || resolveDefaultPathForRole(viewer?.role ?? "athlete");
  redirect(destination);
}

export async function signOutAction() {
  const config = getSupabaseConfig();

  if (config) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
