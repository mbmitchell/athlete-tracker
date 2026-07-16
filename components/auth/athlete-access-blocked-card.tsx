import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppViewer } from "@/lib/types/domain";

type AthleteAccessBlockedCardProps = {
  viewer: AppViewer;
};

export function AthleteAccessBlockedCard({ viewer }: AthleteAccessBlockedCardProps) {
  const isDisabled = viewer.accessState === "athlete_disabled";

  return (
    <div className="page-shell">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{isDisabled ? "Athlete login disabled" : "Athlete login not connected"}</CardTitle>
          <CardDescription>
            {isDisabled
              ? "This athlete login has been disabled by an administrator. Training history is preserved, but access is blocked."
              : "This login is signed in, but it is not currently connected to an athlete profile."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Signed in as {viewer.email || viewer.displayName}. Contact your trainer if you expected access to your dashboard or workouts.
          </div>
          <form action={signOutAction}>
            <Button className="w-full" size="lg" type="submit">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
