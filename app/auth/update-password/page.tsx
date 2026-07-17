import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { DemoModeBanner } from "@/components/shared/demo-mode-banner";
import { getSupabasePublicConfigStatus } from "@/lib/env";

export default function UpdatePasswordPage() {
  const configStatus = getSupabasePublicConfigStatus();

  return (
    <div className="page-shell min-h-[100svh] justify-center">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-5">
          {configStatus === "missing" ? <DemoModeBanner /> : null}
          {configStatus === "partial" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Supabase configuration is incomplete. Set both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </div>
          ) : null}
          <div className="pill-label w-fit">Athlete account recovery</div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Recover access without leaving your athlete workflow.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Open the recovery link in Safari, set a new password, and continue straight to the athlete dashboard without looping back through login.
            </p>
          </div>
        </section>
        {configStatus === "configured" ? (
          <UpdatePasswordForm />
        ) : (
          <div className="rounded-3xl border border-border bg-background p-6 text-sm text-muted-foreground">
            Password recovery is only available once Supabase authentication is configured for this environment.
          </div>
        )}
      </div>
    </div>
  );
}
