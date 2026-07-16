import Link from "next/link";

import { manageWorkoutBuilderAction } from "@/app/actions/workouts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AssignedWorkout, AthleteSummary, ExerciseLibraryEntry } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type WorkoutBuilderProps = {
  workout: AssignedWorkout;
  athleteName: string;
  athletes: AthleteSummary[];
  exercises: ExerciseLibraryEntry[];
};

const resultTypes = [
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
] as const;

export function WorkoutBuilder({ workout, athleteName, athletes, exercises }: WorkoutBuilderProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pill-label">Workout builder</p>
          <h2 className="mt-2 text-2xl font-semibold">{athleteName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {workout.workoutDate} · {workout.status}
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          href={`/workouts/${workout.workoutDate}?athleteId=${workout.athleteId}`}
        >
          Preview athlete view
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workout details</CardTitle>
          <CardDescription>Set the session title, objective, duration, and publication status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={manageWorkoutBuilderAction} className="grid gap-4">
            <input name="intent" type="hidden" value="update_workout_header" />
            <input name="athleteId" type="hidden" value={workout.athleteId} />
            <input name="workoutId" type="hidden" value={workout.id} />
            <input name="trainingWeekId" type="hidden" value={workout.trainingWeekId ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={workout.title} />
              <Field label="Workout date" name="workoutDate" defaultValue={workout.workoutDate} type="date" />
              <Field
                label="Estimated duration"
                name="estimatedDurationMinutes"
                defaultValue={workout.estimatedDurationMinutes?.toString() ?? ""}
              />
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                  defaultValue={workout.status}
                  id="status"
                  name="status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Textarea defaultValue={workout.objective} id="objective" name="objective" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin notes</Label>
              <Textarea defaultValue={workout.adminNotes} id="adminNotes" name="adminNotes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skipReason">Skip reason</Label>
              <Input defaultValue={workout.skipReason} id="skipReason" name="skipReason" />
            </div>
            <div className="flex justify-end">
              <Button size="lg" type="submit">
                Save workout
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {workout.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={manageWorkoutBuilderAction} className="grid gap-4 rounded-2xl bg-muted/50 p-4">
                  <input name="intent" type="hidden" value="update_section" />
                  <input name="athleteId" type="hidden" value={workout.athleteId} />
                  <input name="workoutId" type="hidden" value={workout.id} />
                  <input name="sectionId" type="hidden" value={section.id} />
                  <Field label="Section title" name="title" defaultValue={section.title} />
                  <div className="space-y-2">
                    <Label htmlFor={`section-description-${section.id}`}>Description</Label>
                    <Textarea
                      defaultValue={section.description}
                      id={`section-description-${section.id}`}
                      name="description"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" type="submit">
                      Save section
                    </Button>
                    <MoveButton athleteId={workout.athleteId} workoutId={workout.id} sectionId={section.id} direction="up" />
                    <MoveButton athleteId={workout.athleteId} workoutId={workout.id} sectionId={section.id} direction="down" />
                    <DeleteSectionButton athleteId={workout.athleteId} workoutId={workout.id} sectionId={section.id} />
                  </div>
                </form>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <form action={manageWorkoutBuilderAction} className="rounded-3xl border border-border p-4" key={item.id}>
                      <input name="intent" type="hidden" value="update_item" />
                      <input name="athleteId" type="hidden" value={workout.athleteId} />
                      <input name="workoutId" type="hidden" value={workout.id} />
                      <input name="sectionId" type="hidden" value={section.id} />
                      <input name="itemId" type="hidden" value={item.id} />
                      <div className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Item name" name="customName" defaultValue={item.name} />
                          <div className="space-y-2">
                            <Label htmlFor={`result-type-${item.id}`}>Result type</Label>
                            <select
                              className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                              defaultValue={item.resultEntryType}
                              id={`result-type-${item.id}`}
                              name="resultEntryType"
                            >
                              {resultTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Field label="Sets" name="prescribedSets" defaultValue={item.prescribedSets} />
                          <Field label="Reps" name="prescribedReps" defaultValue={item.prescribedReps} />
                          <Field label="Load" name="prescribedLoad" defaultValue={item.prescribedLoad} />
                          <Field label="Duration sec" name="prescribedDurationSeconds" defaultValue={item.prescribedDurationSeconds} />
                          <Field label="Distance" name="prescribedDistance" defaultValue={item.prescribedDistance} />
                          <Field label="Rest sec" name="restSeconds" defaultValue={item.restSeconds} />
                          <Field label="Target value" name="targetValue" defaultValue={item.targetValue} />
                          <Field label="Target unit" name="targetUnit" defaultValue={item.targetUnit} />
                          <Field label="Prescribed unit" name="prescribedUnit" defaultValue={item.prescribedUnit} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-instructions-${item.id}`}>Instructions</Label>
                          <Textarea defaultValue={item.instructions} id={`item-instructions-${item.id}`} name="instructions" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input defaultChecked={item.required} name="required" type="checkbox" value="true" />
                            Required item
                          </label>
                          <Button size="sm" type="submit">
                            Save item
                          </Button>
                          <MoveItemButton athleteId={workout.athleteId} workoutId={workout.id} sectionId={section.id} itemId={item.id} direction="up" />
                          <MoveItemButton athleteId={workout.athleteId} workoutId={workout.id} sectionId={section.id} itemId={item.id} direction="down" />
                          <DeleteItemButton athleteId={workout.athleteId} workoutId={workout.id} itemId={item.id} />
                        </div>
                      </div>
                    </form>
                  ))}
                </div>

                <form action={manageWorkoutBuilderAction} className="rounded-3xl border border-dashed border-border p-4">
                  <input name="intent" type="hidden" value="add_item" />
                  <input name="athleteId" type="hidden" value={workout.athleteId} />
                  <input name="workoutId" type="hidden" value={workout.id} />
                  <input name="sectionId" type="hidden" value={section.id} />
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`exerciseId-${section.id}`}>Exercise from library</Label>
                      <select
                        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                        defaultValue=""
                        id={`exerciseId-${section.id}`}
                        name="exerciseId"
                      >
                        <option value="">Custom activity</option>
                        {exercises.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field label="Custom item name" name="customName" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Sets" name="prescribedSets" />
                      <Field label="Reps" name="prescribedReps" />
                      <Field label="Load" name="prescribedLoad" />
                      <Field label="Duration sec" name="prescribedDurationSeconds" />
                      <Field label="Distance" name="prescribedDistance" />
                      <Field label="Rest sec" name="restSeconds" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`resultEntryType-${section.id}`}>Result type</Label>
                      <select
                        className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                        defaultValue="text"
                        id={`resultEntryType-${section.id}`}
                        name="resultEntryType"
                      >
                        {resultTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`instructions-${section.id}`}>Instructions</Label>
                      <Textarea id={`instructions-${section.id}`} name="instructions" />
                    </div>
                    <Button size="sm" type="submit">
                      Add item
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Add section</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={manageWorkoutBuilderAction} className="grid gap-4">
                <input name="intent" type="hidden" value="add_section" />
                <input name="athleteId" type="hidden" value={workout.athleteId} />
                <input name="workoutId" type="hidden" value={workout.id} />
                <Field label="Section title" name="title" />
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>
                <Button size="sm" type="submit">
                  Add section
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Copy workout</CardTitle>
            <CardDescription>Copy to another date or athlete as an independent draft snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={manageWorkoutBuilderAction} className="space-y-4">
              <input name="intent" type="hidden" value="copy_workout" />
              <input name="athleteId" type="hidden" value={workout.athleteId} />
              <input name="workoutId" type="hidden" value={workout.id} />
              <div className="space-y-2">
                <Label htmlFor="targetAthleteId">Target athlete</Label>
                <select
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                  defaultValue={workout.athleteId}
                  id="targetAthleteId"
                  name="targetAthleteId"
                >
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Target date" name="targetDate" defaultValue={workout.workoutDate} type="date" />
              <Button className="w-full" type="submit">
                Copy workout
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text"
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={defaultValue} id={name} name={name} type={type} />
    </div>
  );
}

function MoveButton({
  athleteId,
  workoutId,
  sectionId,
  direction
}: {
  athleteId: string;
  workoutId: string;
  sectionId: string;
  direction: "up" | "down";
}) {
  return (
    <form action={manageWorkoutBuilderAction}>
      <input name="intent" type="hidden" value="move_section" />
      <input name="athleteId" type="hidden" value={athleteId} />
      <input name="workoutId" type="hidden" value={workoutId} />
      <input name="sectionId" type="hidden" value={sectionId} />
      <input name="direction" type="hidden" value={direction} />
      <Button size="sm" type="submit" variant="outline">
        Move {direction}
      </Button>
    </form>
  );
}

function DeleteSectionButton({
  athleteId,
  workoutId,
  sectionId
}: {
  athleteId: string;
  workoutId: string;
  sectionId: string;
}) {
  return (
    <form action={manageWorkoutBuilderAction}>
      <input name="intent" type="hidden" value="delete_section" />
      <input name="athleteId" type="hidden" value={athleteId} />
      <input name="workoutId" type="hidden" value={workoutId} />
      <input name="sectionId" type="hidden" value={sectionId} />
      <Button size="sm" type="submit" variant="secondary">
        Delete section
      </Button>
    </form>
  );
}

function MoveItemButton({
  athleteId,
  workoutId,
  sectionId,
  itemId,
  direction
}: {
  athleteId: string;
  workoutId: string;
  sectionId: string;
  itemId: string;
  direction: "up" | "down";
}) {
  return (
    <form action={manageWorkoutBuilderAction}>
      <input name="intent" type="hidden" value="move_item" />
      <input name="athleteId" type="hidden" value={athleteId} />
      <input name="workoutId" type="hidden" value={workoutId} />
      <input name="sectionId" type="hidden" value={sectionId} />
      <input name="itemId" type="hidden" value={itemId} />
      <input name="direction" type="hidden" value={direction} />
      <Button size="sm" type="submit" variant="outline">
        Move {direction}
      </Button>
    </form>
  );
}

function DeleteItemButton({
  athleteId,
  workoutId,
  itemId
}: {
  athleteId: string;
  workoutId: string;
  itemId: string;
}) {
  return (
    <form action={manageWorkoutBuilderAction}>
      <input name="intent" type="hidden" value="delete_item" />
      <input name="athleteId" type="hidden" value={athleteId} />
      <input name="workoutId" type="hidden" value={workoutId} />
      <input name="itemId" type="hidden" value={itemId} />
      <Button size="sm" type="submit" variant="secondary">
        Delete item
      </Button>
    </form>
  );
}
