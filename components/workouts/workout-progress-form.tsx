"use client";

import { saveAthleteWorkoutProgressAction } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyWorkout } from "@/lib/types/domain";

type WorkoutProgressFormProps = {
  workout: DailyWorkout;
  allowCompletedEdit: boolean;
};

export function WorkoutProgressForm({ workout, allowCompletedEdit }: WorkoutProgressFormProps) {
  const disabled = !workout.canEdit;

  return (
    <form action={saveAthleteWorkoutProgressAction} className="space-y-6">
      <input name="workoutDate" type="hidden" value={workout.workoutDateIso} />
      <input name="allowCompletedEdit" type="hidden" value={allowCompletedEdit ? "true" : "false"} />
      <section className="rounded-3xl border border-border bg-muted/40 p-4">
        <div className="mb-4">
          <p className="font-semibold">Readiness</p>
          <p className="text-sm text-muted-foreground">Collect self-report data before or during the session. Partial saves are supported.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadinessField label="Sleep hours" name="sleepHours" defaultValue={workout.readinessEntry?.sleepHours ?? ""} disabled={disabled} />
          <ReadinessSelect label="Sleep quality" name="sleepQuality" defaultValue={workout.readinessEntry?.sleepQuality ?? ""} disabled={disabled} />
          <ReadinessSelect label="Energy" name="energy" defaultValue={workout.readinessEntry?.energy ?? ""} disabled={disabled} />
          <ReadinessSelect label="Soreness" name="soreness" defaultValue={workout.readinessEntry?.soreness ?? ""} disabled={disabled} />
          <ReadinessSelect label="Stress" name="stress" defaultValue={workout.readinessEntry?.stress ?? ""} disabled={disabled} />
          <ReadinessField label="Body weight" name="bodyWeight" defaultValue={workout.readinessEntry?.bodyWeight ?? ""} disabled={disabled} />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="readinessNote">Readiness note</Label>
          <Textarea defaultValue={workout.readinessEntry?.note ?? ""} disabled={disabled} id="readinessNote" name="readinessNote" />
        </div>
      </section>

      {workout.sections.map((section, sectionIndex) => (
        <section className="rounded-3xl border border-border bg-white p-4" key={section.id}>
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Section {sectionIndex + 1}
            </p>
            <h3 className="mt-2 text-xl font-semibold">{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          </div>
          <div className="space-y-4">
            {section.items.map((item, itemIndex) => (
              <div className="rounded-3xl bg-muted/50 p-4" key={item.id}>
                <div className="mb-3">
                  <p className="font-semibold">
                    {sectionIndex + 1}.{itemIndex + 1} {item.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.instructions}</p>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Metric label="Sets" value={item.prescribedSets} />
                  <Metric label="Reps" value={item.prescribedReps} />
                  <Metric label="Load" value={item.prescribedLoad} />
                  <Metric label="Distance" value={item.prescribedDistance} />
                  <Metric label="Target" value={[item.targetValue, item.targetUnit].filter(Boolean).join(" ")} />
                </div>
                <div className="grid gap-4">
                  <label className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-medium">
                    <input
                      defaultChecked={item.result?.completed ?? false}
                      disabled={disabled}
                      name={`completed:${item.id}`}
                      type="checkbox"
                    />
                    Mark item complete
                    {!item.required ? <span className="text-muted-foreground">(Optional)</span> : null}
                  </label>
                  <ResultInputs disabled={disabled} item={item} />
                  <div className="space-y-2">
                    <Label htmlFor={`itemNotes:${item.id}`}>Athlete note</Label>
                    <Textarea
                      defaultValue={item.result?.athleteNotes ?? ""}
                      disabled={disabled}
                      id={`itemNotes:${item.id}`}
                      name={`itemNotes:${item.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-3xl border border-border bg-white p-4">
        <div className="space-y-2">
          <Label htmlFor="athleteNotes">Session note</Label>
          <Textarea defaultValue={workout.athleteNotes} disabled={disabled} id="athleteNotes" name="athleteNotes" />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button disabled={disabled} name="intent" type="submit" value="save_progress" variant="outline">
          Save progress
        </Button>
        <Button
          disabled={disabled || !workout.canMarkComplete}
          name="intent"
          onClick={(event) => {
            if (!window.confirm("Mark this session complete? You can still reopen it later with the explicit edit flow.")) {
              event.preventDefault();
            }
          }}
          type="submit"
          value="complete_workout"
        >
          Complete session
        </Button>
      </div>
    </form>
  );
}

function ReadinessField({
  label,
  name,
  defaultValue,
  disabled
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} disabled={disabled} id={name} name={name} />
    </div>
  );
}

function ReadinessSelect({
  label,
  name,
  defaultValue,
  disabled
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
        defaultValue={defaultValue || ""}
        disabled={disabled}
        id={name}
        name={name}
      >
        <option value="">Not entered</option>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultInputs({ item, disabled }: { item: DailyWorkout["sections"][number]["items"][number]; disabled: boolean }) {
  if (item.resultEntryType === "checkbox") {
    return null;
  }

  if (item.resultEntryType === "sets_reps" || item.resultEntryType === "sets_reps_weight") {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadinessField label="Actual sets" name={`actualSets:${item.id}`} defaultValue={item.result?.actualSets ?? ""} disabled={disabled} />
        <ReadinessField label="Actual reps" name={`actualReps:${item.id}`} defaultValue={item.result?.actualReps ?? ""} disabled={disabled} />
        <ReadinessField label="Actual load" name={`actualLoad:${item.id}`} defaultValue={item.result?.actualLoad ?? ""} disabled={disabled} />
      </div>
    );
  }

  if (item.resultEntryType === "duration") {
    return <ReadinessField label="Actual duration" name={`actualDurationSeconds:${item.id}`} defaultValue={item.result?.actualDurationSeconds ?? ""} disabled={disabled} />;
  }

  if (item.resultEntryType === "distance") {
    return <ReadinessField label="Actual distance" name={`actualDistance:${item.id}`} defaultValue={item.result?.actualDistance ?? ""} disabled={disabled} />;
  }

  if (item.resultEntryType === "rating") {
    return <ReadinessSelect label="Rating" name={`rating:${item.id}`} defaultValue={item.result?.rating ?? ""} disabled={disabled} />;
  }

  if (item.resultEntryType === "text") {
    return (
      <div className="space-y-2">
        <Label htmlFor={`textResult:${item.id}`}>Text result</Label>
        <Textarea defaultValue={item.result?.textResult ?? ""} disabled={disabled} id={`textResult:${item.id}`} name={`textResult:${item.id}`} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ReadinessField label="Actual value" name={`actualValue:${item.id}`} defaultValue={item.result?.actualValue ?? ""} disabled={disabled} />
      <ReadinessField label="Unit" name={`actualUnit:${item.id}`} defaultValue={item.result?.actualUnit ?? ""} disabled={disabled} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value || "-"}</p>
    </div>
  );
}
