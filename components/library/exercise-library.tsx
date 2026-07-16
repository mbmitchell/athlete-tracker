import { saveExerciseLibraryAction, seedStarterLibraryAction, toggleExerciseActiveAction } from "@/app/actions/library";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseLibraryEntry } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

const categories: ExerciseLibraryEntry["category"][] = [
  "readiness",
  "warm_up",
  "mobility",
  "strength",
  "power",
  "speed",
  "agility",
  "hitting",
  "throwing",
  "catching",
  "defense",
  "pitching",
  "recovery",
  "nutrition",
  "recruiting",
  "custom"
];

const resultTypes: ExerciseLibraryEntry["defaultUnitType"][] = [
  "checkbox",
  "sets_reps",
  "sets_reps_weight",
  "duration",
  "distance",
  "velocity",
  "count",
  "text",
  "numeric",
  "percentage",
  "rating"
];

type ExerciseLibraryProps = {
  exercises: ExerciseLibraryEntry[];
  selectedExerciseId?: string;
};

export function ExerciseLibrary({ exercises, selectedExerciseId }: ExerciseLibraryProps) {
  const selected = exercises.find((exercise) => exercise.id === selectedExerciseId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pill-label">Exercise library</p>
          <h2 className="mt-2 text-2xl font-semibold">Reusable baseball training elements</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, tune, and deactivate reusable exercises so workouts stay consistent while snapshots remain historically accurate.
          </p>
        </div>
        <form action={seedStarterLibraryAction}>
          <Button size="lg" type="submit" variant="outline">
            Seed starter library
          </Button>
        </form>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{selected ? `Edit ${selected.name}` : "Create exercise"}</CardTitle>
          <CardDescription>
            Library definitions feed the workout builder but do not retroactively change already assigned workouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveExerciseLibraryAction} className="grid gap-4">
            <input name="exerciseId" type="hidden" value={selected?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exercise name" name="name" defaultValue={selected?.name ?? ""} required />
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                  defaultValue={selected?.category ?? "strength"}
                  id="category"
                  name="category"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultUnitType">Default result type</Label>
                <select
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                  defaultValue={selected?.defaultUnitType ?? "checkbox"}
                  id="defaultUnitType"
                  name="defaultUnitType"
                >
                  {resultTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Equipment" name="equipment" defaultValue={selected?.equipment ?? ""} />
              <Field label="Video URL" name="videoUrl" defaultValue={selected?.videoUrl ?? ""} />
              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <select
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                  defaultValue={selected?.active === false ? "false" : "true"}
                  id="active"
                  name="active"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <TextField label="Description" name="description" defaultValue={selected?.description ?? ""} />
            <TextField label="Coaching cues" name="coachingCues" defaultValue={selected?.coachingCues ?? ""} />
            <div className="flex justify-end">
              <Button size="lg" type="submit">
                {selected ? "Save exercise" : "Create exercise"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{exercise.name}</CardTitle>
                <CardDescription className="mt-1">
                  {exercise.category.replace("_", " ")} · {exercise.defaultUnitType.replaceAll("_", " ")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <a className={buttonVariants({ variant: "outline", size: "sm" })} href={`/library/exercises?edit=${exercise.id}`}>
                  Edit
                </a>
                <form action={toggleExerciseActiveAction}>
                  <input name="exerciseId" type="hidden" value={exercise.id} />
                  <input name="nextActive" type="hidden" value={exercise.active ? "false" : "true"} />
                  <Button size="sm" type="submit" variant="secondary">
                    {exercise.active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{exercise.description}</p>
              <div className="rounded-2xl bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coaching cues</p>
                <p className="mt-2">{exercise.coachingCues || "No cues added yet."}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = false
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} required={required} />
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea defaultValue={defaultValue} id={name} name={name} />
    </div>
  );
}
