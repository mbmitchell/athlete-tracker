import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppViewer } from "@/lib/auth/session";
import { getAthletesForViewer } from "@/lib/data/athletes";
import { getWeekStartIso } from "@/lib/workouts/date";
import { cn } from "@/lib/utils";

export default async function AthleteDirectoryPage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  const athletes = await getAthletesForViewer(viewer);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pill-label">Athlete directory</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {viewer.role === "admin"
              ? "Manage athlete profiles"
              : viewer.role === "parent"
                ? "Linked athletes"
                : "Your athlete profile"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewer.role === "admin"
              ? "Review profile completeness, update development notes, and keep athlete records current."
              : "This view is filtered to only the athletes connected to your account."}
          </p>
        </div>
        {viewer.role === "admin" ? (
          <Link className={buttonVariants({ size: "lg" })} href="/athletes/new">
            Create athlete
          </Link>
        ) : null}
      </section>

      <div className="grid gap-4">
        {athletes.length > 0 ? (
          athletes.map((athlete) => (
            <Card key={athlete.id}>
              <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{athlete.firstName} {athlete.lastName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Class of {athlete.graduationYear} · {athlete.primaryPosition}
                    {athlete.secondaryPosition ? ` / ${athlete.secondaryPosition}` : ""}
                  </p>
                </div>
                {viewer.role === "admin" ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                      href={`/athletes/${athlete.id}/edit`}
                    >
                      Edit profile
                    </Link>
                    <Link
                      className={cn(buttonVariants({ size: "sm" }), "w-fit")}
                      href={`/athletes/${athlete.id}/weeks/${getWeekStartIso(new Date().toISOString().slice(0, 10))}`}
                    >
                      Open week
                    </Link>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
                <DirectoryField label="Hometown" value={athlete.hometown} />
                <DirectoryField label="Current team" value={athlete.currentTeam || "Not set"} />
                <DirectoryField
                  label="Status"
                  value={athlete.active ? "Active" : "Inactive"}
                />
                <div className="sm:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Current development focus
                  </p>
                  <p className="mt-2 font-medium">
                    {athlete.currentDevelopmentFocus || "No current focus has been set yet."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No athlete profiles are available for this account yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DirectoryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
