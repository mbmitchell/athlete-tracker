import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { InstallHelpPanel } from "@/components/pwa/install-help-panel";
import { resolveDefaultPathForRole } from "@/lib/auth/roles";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { getAppViewer } from "@/lib/auth/session";
import { getSupabasePublicConfigStatus } from "@/lib/env";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const viewer = await getAppViewer();

  if (viewer) {
    const destination = resolveDefaultPathForRole(viewer.role);

    console.info("[auth-redirect]", {
      pathname: "/login",
      destination,
      authStateCategory: "authenticated"
    });

    redirect(destination);
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error =
    typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : undefined;
  const redirectTo =
    typeof resolvedSearchParams?.redirectTo === "string"
      ? resolvedSearchParams.redirectTo
      : undefined;
  const configStatus = getSupabasePublicConfigStatus();

  return (
    <div className="page-shell min-h-[100svh] justify-center">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-5">
          {configStatus === "missing" ? <DemoModeBanner /> : null}
          {configStatus === "partial" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Supabase configuration is incomplete. Set both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </div>
          ) : null}
          <div className="pill-label w-fit">Mobile-first training OS</div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Build organized, private, athlete-centered development workflows.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Athlete Development Hub gives trainers, athletes, and parents a secure shared view of training plans without exposing sensitive health, recruiting, or performance data.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ValueCard label="Admin" value="Manage many athletes" />
            <ValueCard label="Athlete" value="Own training only" />
            <ValueCard label="Parent" value="Linked athletes only" />
          </div>
          <InstallHelpPanel compact />
        </section>
        <LoginForm demoMode={configStatus === "missing"} error={error} redirectTo={redirectTo} />
      </div>
    </div>
  );
}

function ValueCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="section-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}
