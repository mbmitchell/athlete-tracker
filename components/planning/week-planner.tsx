import Link from "next/link";

import { manageWeekPlanAction } from "@/app/actions/workouts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TrainingWeekDetail, WorkoutTemplate } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type WeekPlannerProps = {
  week: TrainingWeekDetail;
  templates: WorkoutTemplate[];
  feedback?: {
    status?: string;
    error?: string;
  };
};

const weekMessageMap = {
  saved: "Week plan saved.",
  imported: "Plan imported as draft workouts.",
  imported_partial: "Plan imported, but one or more occupied days were skipped.",
  demo_mode: "Demo mode is active. Changes are not saved.",
  action_failed: "The week update could not be completed.",
  invalid_week: "Review the week details and try again.",
  delete_only_drafts: "Only draft workouts can be deleted from the weekly planner.",
  no_prior_week: "No prior week was available to copy.",
  week_has_results: "This week already contains athlete progress, so it cannot be unpublished."
} as const;

export function WeekPlanner({ week, templates, feedback }: WeekPlannerProps) {
  const statusMessage = feedback?.status
    ? weekMessageMap[feedback.status as keyof typeof weekMessageMap]
    : null;
  const errorMessage = feedback?.error
    ? weekMessageMap[feedback.error as keyof typeof weekMessageMap]
    : null;

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">{statusMessage}</div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pill-label">Weekly plan</p>
          <h2 className="mt-2 text-2xl font-semibold">{week.athleteName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Week of {week.weekStartDate} · {week.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={`/athletes/${week.athleteId}/import-plan?weekStart=${week.weekStartDate}`}
          >
            Import plan
          </Link>
          <form action={manageWeekPlanAction}>
            <input name="intent" type="hidden" value="copy_prior_week" />
            <input name="athleteId" type="hidden" value={week.athleteId} />
            <input name="weekStart" type="hidden" value={week.weekStartDate} />
            <Button size="sm" type="submit" variant="outline">
              Copy prior week
            </Button>
          </form>
          <form action={manageWeekPlanAction}>
            <input name="intent" type="hidden" value={week.status === "published" ? "unpublish_week" : "publish_week"} />
            <input name="athleteId" type="hidden" value={week.athleteId} />
            <input name="weekStart" type="hidden" value={week.weekStartDate} />
            <Button size="sm" type="submit">
              {week.status === "published" ? "Unpublish week" : "Publish week"}
            </Button>
          </form>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Week metadata</CardTitle>
          <CardDescription>Set the focus and notes that frame the athlete’s seven-day plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={manageWeekPlanAction} className="grid gap-4">
            <input name="intent" type="hidden" value="update_week" />
            <input name="athleteId" type="hidden" value={week.athleteId} />
            <input name="weekStart" type="hidden" value={week.weekStartDate} />
            <input name="weekId" type="hidden" value={week.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={week.title} />
              <Field label="Weekly focus" name="focus" defaultValue={week.focus} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin notes</Label>
              <Textarea defaultValue={week.adminNotes} id="adminNotes" name="adminNotes" />
            </div>
            <div className="flex justify-end">
              <Button size="lg" type="submit">
                Save week details
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <p className="pill-label">Seven-day layout</p>
          <h3 className="mt-2 text-xl font-semibold">Draft, assign, and publish one day at a time.</h3>
        </div>
        <div className="grid gap-4 xl:grid-cols-7">
          {week.days.map((day) => (
            <Card key={day.date} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{day.label}</CardTitle>
                <CardDescription>{day.fullLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {day.workout ? (
                  <>
                    <div className="rounded-2xl bg-muted/60 p-3">
                      <p className="font-semibold">{day.workout.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{day.workout.status}</p>
                    </div>
                    <Link
                      className={cn(buttonVariants({ size: "sm" }), "w-full")}
                      href={`/athletes/${week.athleteId}/workouts/${day.workout.id}/edit`}
                    >
                      Open builder
                    </Link>
                    <Link
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                      href={`/workouts/${day.date}?athleteId=${week.athleteId}`}
                    >
                      Preview athlete view
                    </Link>
                    {day.workout.status === "draft" ? (
                      <form action={manageWeekPlanAction}>
                        <input name="intent" type="hidden" value="delete_workout" />
                        <input name="athleteId" type="hidden" value={week.athleteId} />
                        <input name="weekStart" type="hidden" value={week.weekStartDate} />
                        <input name="workoutId" type="hidden" value={day.workout.id} />
                        <Button className="w-full" size="sm" type="submit" variant="secondary">
                          Delete draft workout
                        </Button>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <>
                    <form action={manageWeekPlanAction} className="space-y-3">
                      <input name="intent" type="hidden" value="create_blank_workout" />
                      <input name="athleteId" type="hidden" value={week.athleteId} />
                      <input name="weekStart" type="hidden" value={week.weekStartDate} />
                      <input name="workoutDate" type="hidden" value={day.date} />
                      <Button className="w-full" size="sm" type="submit">
                        Create workout
                      </Button>
                    </form>
                    <form action={manageWeekPlanAction} className="space-y-3">
                      <input name="intent" type="hidden" value="create_from_template" />
                      <input name="athleteId" type="hidden" value={week.athleteId} />
                      <input name="weekStart" type="hidden" value={week.weekStartDate} />
                      <input name="workoutDate" type="hidden" value={day.date} />
                      <div className="space-y-2">
                        <Label htmlFor={`template-${day.date}`}>Template</Label>
                        <select
                          className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                          defaultValue={templates[0]?.id}
                          id={`template-${day.date}`}
                          name="templateId"
                        >
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button className="w-full" size="sm" type="submit" variant="outline">
                        Assign template
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} />
    </div>
  );
}
