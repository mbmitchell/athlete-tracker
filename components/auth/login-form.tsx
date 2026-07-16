import { AlertCircle, ArrowRight, KeyRound } from "lucide-react";

import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  error?: string;
  redirectTo?: string;
  demoMode: boolean;
};

export function LoginForm({ error, redirectTo, demoMode }: LoginFormProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 bg-gradient-to-br from-primary/10 via-white to-accent/25">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage athlete development plans, weekly schedules, and daily training execution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {demoMode ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            Supabase is not configured yet. The app is running in preview mode so you can review the mobile-first shell and page foundation.
          </div>
        ) : null}
        {error ? (
          <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>We could not sign you in with those credentials.</span>
          </div>
        ) : null}
        <form action={signInAction} className="space-y-4">
          <input name="redirectTo" type="hidden" value={redirectTo ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input autoComplete="email" id="email" name="email" placeholder="coach@club.com" required type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete="current-password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
          </div>
          <Button className="w-full" size="lg" type="submit">
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
