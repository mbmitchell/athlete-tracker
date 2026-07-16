import {
  connectExistingAthleteAccountAction,
  disableAthleteAccountAction,
  disconnectAthleteAccountAction,
  inviteAthleteAccountAction,
  resendAthleteInvitationAction
} from "@/app/actions/athletes";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AthleteProfile } from "@/lib/types/domain";

type AthleteAccountManagerProps = {
  athlete: AthleteProfile;
  feedback?: {
    status?: string;
    error?: string;
  };
};

const statusMap = {
  none: {
    label: "No login connected",
    variant: "outline"
  },
  invited: {
    label: "Invitation pending",
    variant: "warning"
  },
  connected: {
    label: "Login connected",
    variant: "success"
  },
  disabled: {
    label: "Login disabled",
    variant: "destructive"
  }
} as const;

const messageMap = {
  demo_mode: "Demo mode is active. Athlete account actions are not persisted.",
  invited: "Invitation sent. The athlete can finish setup from the Supabase invite email.",
  connected: "The existing authentication user is now connected to this athlete profile.",
  invitation_resent: "Invitation resent to the athlete email on file.",
  login_disabled: "The athlete login has been disabled. Training history was preserved.",
  login_disconnected: "The athlete login was disconnected. Training history was preserved.",
  service_role_missing:
    "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to local and Vercel server-side environment variables.",
  existing_user_use_connect:
    "That email already exists in Supabase Auth. Use Connect existing authentication user instead.",
  user_not_found: "No Supabase authentication user was found for that email.",
  user_already_connected_elsewhere:
    "That authentication user is already linked to a different athlete profile.",
  athlete_already_has_different_login:
    "This athlete already has a different login connected. Disconnect it before linking another user.",
  admin_account_not_allowed: "Admin accounts cannot be connected as athlete logins.",
  parent_account_not_allowed: "Parent accounts cannot be repurposed as athlete logins in this phase.",
  athlete_already_has_login: "This athlete already has a login state on file.",
  invite_not_pending: "Only pending invitations can be resent.",
  disable_requires_connected_login: "Only connected or pending athlete logins can be disabled.",
  disconnect_requires_login: "There is no login to disconnect for this athlete.",
  account_action_failed: "The athlete account action could not be completed.",
  invite_failed: "Supabase could not send the athlete invitation.",
  disable_failed: "Supabase could not disable the athlete login."
} as const;

export function AthleteAccountManager({ athlete, feedback }: AthleteAccountManagerProps) {
  const account = athlete.accountConnection;
  const statusConfig = statusMap[account.status];
  const sharedEmail = account.email;
  const infoMessage = feedback?.status ? messageMap[feedback.status as keyof typeof messageMap] : null;
  const errorMessage = feedback?.error ? messageMap[feedback.error as keyof typeof messageMap] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Athlete account management</CardTitle>
        <CardDescription>
          Invite or connect a Supabase Auth login without manually editing athlete records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {infoMessage ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{infoMessage}</div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
        ) : null}

        <div className="rounded-3xl bg-muted/60 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Current login status</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use invitations for new athlete logins, or connect an existing athlete-only auth user when appropriate.
              </p>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AccountStat label="Login email" value={account.email || "Not set"} />
            <AccountStat
              label="Connected on"
              value={account.connectedAt ? formatDateTime(account.connectedAt) : "Not connected"}
            />
            <AccountStat
              label="Invited on"
              value={account.invitedAt ? formatDateTime(account.invitedAt) : "Not invited"}
            />
            <AccountStat
              label="Disabled on"
              value={account.disabledAt ? formatDateTime(account.disabledAt) : "Active"}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={inviteAthleteAccountAction} className="space-y-3 rounded-3xl border border-border p-4">
            <input name="athleteId" type="hidden" value={athlete.id} />
            <div className="space-y-1">
              <p className="font-semibold">Invite athlete by email</p>
              <p className="text-sm text-muted-foreground">
                Creates a Supabase invitation server-side and links the resulting auth user to this athlete.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`invite-email-${athlete.id}`}>Athlete email</Label>
              <Input
                defaultValue={sharedEmail}
                id={`invite-email-${athlete.id}`}
                name="email"
                placeholder="athlete@example.com"
                required
                type="email"
              />
            </div>
            <Button className="w-full" type="submit">
              Send invitation
            </Button>
          </form>

          <form action={connectExistingAthleteAccountAction} className="space-y-3 rounded-3xl border border-border p-4">
            <input name="athleteId" type="hidden" value={athlete.id} />
            <div className="space-y-1">
              <p className="font-semibold">Connect existing authentication user</p>
              <p className="text-sm text-muted-foreground">
                Safely attach an existing athlete auth user by email. Admin and parent accounts are blocked.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`connect-email-${athlete.id}`}>Existing auth email</Label>
              <Input
                defaultValue={sharedEmail}
                id={`connect-email-${athlete.id}`}
                name="email"
                placeholder="athlete@example.com"
                required
                type="email"
              />
            </div>
            <Button className="w-full" type="submit" variant="secondary">
              Connect existing user
            </Button>
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <form action={resendAthleteInvitationAction}>
            <input name="athleteId" type="hidden" value={athlete.id} />
            <Button className="w-full" disabled={account.status !== "invited"} type="submit" variant="outline">
              Resend invitation
            </Button>
          </form>
          <form action={disableAthleteAccountAction}>
            <input name="athleteId" type="hidden" value={athlete.id} />
            <ConfirmSubmitButton
              className="w-full"
              confirmationMessage={`Disable ${athlete.firstName}'s login? This keeps training history but immediately blocks athlete access.`}
              disabled={account.status !== "connected" && account.status !== "invited"}
              type="submit"
              variant="outline"
            >
              Disable login
            </ConfirmSubmitButton>
          </form>
          <form action={disconnectAthleteAccountAction}>
            <input name="athleteId" type="hidden" value={athlete.id} />
            <ConfirmSubmitButton
              className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
              confirmationMessage={`Disconnect ${athlete.firstName}'s login? The athlete profile, workouts, readiness, and results will be preserved.`}
              disabled={account.status === "none"}
              type="submit"
              variant="outline"
            >
              Disconnect login
            </ConfirmSubmitButton>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
