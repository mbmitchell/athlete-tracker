"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getRecoverySuccessRedirectPath,
  getRecoveryUrlDetails,
  resolveRecoveryInitializationState,
  type RecoveryAuthEvent
} from "@/lib/auth/recovery";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoveryViewState =
  | "initializing"
  | "ready"
  | "invalid_or_expired"
  | "saving_password"
  | "success";

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<RecoveryViewState>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const settledRef = useRef(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const recoveryDetails = getRecoveryUrlDetails(currentUrl);
    let authEvent: RecoveryAuthEvent = null;
    let timeoutId: number | null = null;

    const cleanRecoveryUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    const applyState = (nextState: RecoveryViewState, nextError?: string | null) => {
      settledRef.current = nextState !== "initializing";
      setState(nextState);
      setErrorMessage(nextError ?? null);
    };

    const syncRecoveryState = async () => {
      const { data, error } = await supabase.auth.getSession();
      const nextState = resolveRecoveryInitializationState({
        hasSession: Boolean(data.session),
        hasRecoveryMarkers: recoveryDetails.hasRecoveryMarkers,
        errorDescription: recoveryDetails.errorDescription,
        authEvent
      });

      if (nextState === "ready") {
        cleanRecoveryUrl();
        applyState("ready");
        return;
      }

      if (nextState === "invalid_or_expired") {
        cleanRecoveryUrl();
        applyState(
          "invalid_or_expired",
          recoveryDetails.errorDescription ??
            error?.message ??
            "This password recovery link is invalid or expired."
        );
        return;
      }

      applyState("initializing");
    };

    void syncRecoveryState();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        authEvent = event;
      }

      const nextState = resolveRecoveryInitializationState({
        hasSession: Boolean(session),
        hasRecoveryMarkers: recoveryDetails.hasRecoveryMarkers,
        errorDescription: recoveryDetails.errorDescription,
        authEvent
      });

      if (nextState === "ready") {
        cleanRecoveryUrl();
        applyState("ready");
      }
    });

    timeoutId = window.setTimeout(() => {
      if (!settledRef.current) {
        void syncRecoveryState();
      }
    }, 1500);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setErrorMessage("Use at least 8 characters for the new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match yet.");
      return;
    }

    setState("saving_password");
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      setState("ready");
      setErrorMessage(error.message);
      return;
    }

    setState("success");
    router.replace(getRecoverySuccessRedirectPath());
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 bg-gradient-to-br from-primary/10 via-white to-accent/25">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Finish athlete account setup or recover access without leaving the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {state === "initializing" ? (
          <StatusPanel
            icon={<LoaderCircle className="h-4 w-4 animate-spin" />}
            title="Initializing recovery"
            body="We are confirming your recovery link and setting up a secure session in this browser."
          />
        ) : null}

        {state === "invalid_or_expired" ? (
          <StatusPanel
            icon={<AlertCircle className="h-4 w-4" />}
            title="Invalid or expired link"
            body={errorMessage ?? "This recovery link can no longer be used. Request a new password reset email."}
            tone="error"
          />
        ) : null}

        {state === "success" ? (
          <StatusPanel
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Password updated"
            body="Your password was updated successfully. Taking you to your athlete dashboard now."
            tone="success"
          />
        ) : null}

        {(state === "ready" || state === "saving_password") ? (
          <form action="#" className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage ? (
              <StatusPanel
                icon={<AlertCircle className="h-4 w-4" />}
                title="We could not save that password"
                body={errorMessage}
                tone="error"
              />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                autoComplete="new-password"
                className="min-h-12"
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                autoComplete="new-password"
                className="min-h-12"
                id="confirm-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            <Button className="w-full" disabled={state === "saving_password"} size="lg" type="submit">
              {state === "saving_password" ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Saving password
                </>
              ) : (
                "Save password"
              )}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusPanel(props: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: "default" | "error" | "success";
}) {
  const toneClassName =
    props.tone === "error"
      ? "bg-rose-50 text-rose-700"
      : props.tone === "success"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-muted/60 text-muted-foreground";

  return (
    <div className={`rounded-2xl p-4 text-sm ${toneClassName}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{props.icon}</div>
        <div>
          <p className="font-semibold">{props.title}</p>
          <p className="mt-1">{props.body}</p>
        </div>
      </div>
    </div>
  );
}
