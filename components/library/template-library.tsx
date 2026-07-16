import { duplicateWorkoutTemplateAction, saveWorkoutTemplateAction, toggleWorkoutTemplateActiveAction } from "@/app/actions/library";
import { assignTemplateFromLibraryAction } from "@/app/actions/workouts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AthleteSummary, WorkoutTemplate } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type TemplateLibraryProps = {
  templates: WorkoutTemplate[];
  athletes: AthleteSummary[];
  selectedTemplateId?: string;
};

export function TemplateLibrary({ templates, athletes, selectedTemplateId }: TemplateLibraryProps) {
  const selected = templates.find((template) => template.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      <section>
        <p className="pill-label">Template library</p>
        <h2 className="mt-2 text-2xl font-semibold">Reusable workout blueprints</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Templates accelerate assignment, but assigned workouts always become independent snapshots once they land on an athlete schedule.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{selected ? `Edit ${selected.name}` : "Create template"}</CardTitle>
          <CardDescription>
            Start with a reusable shell here, then refine individual assigned workouts in the workout builder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveWorkoutTemplateAction} className="grid gap-4">
            <input name="templateId" type="hidden" value={selected?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template name" name="name" defaultValue={selected?.name ?? ""} required />
              <Field
                label="Estimated duration (minutes)"
                name="estimatedDurationMinutes"
                defaultValue={selected?.estimatedDurationMinutes?.toString() ?? ""}
              />
              <Field label="Focus" name="focus" defaultValue={selected?.focus ?? ""} />
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
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea defaultValue={selected?.description ?? ""} id="description" name="description" />
            </div>
            <div className="flex justify-end">
              <Button size="lg" type="submit">
                {selected ? "Save template" : "Create template"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.focus || "No focus added"} · {template.estimatedDurationMinutes ?? "-"} min · {template.sections.length} sections
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className={buttonVariants({ variant: "outline", size: "sm" })} href={`/library/templates?edit=${template.id}`}>
                    Edit
                  </a>
                  <form action={duplicateWorkoutTemplateAction}>
                    <input name="templateId" type="hidden" value={template.id} />
                    <Button size="sm" type="submit" variant="outline">
                      Duplicate
                    </Button>
                  </form>
                  <form action={toggleWorkoutTemplateActiveAction}>
                    <input name="templateId" type="hidden" value={template.id} />
                    <input name="nextActive" type="hidden" value={template.active ? "false" : "true"} />
                    <Button size="sm" type="submit" variant="secondary">
                      {template.active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{template.description || "No description yet."}</p>
                {template.sections.map((section) => (
                  <div className="rounded-2xl border border-border p-3" key={section.id}>
                    <p className="font-semibold">{section.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {section.items.length} items
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl bg-muted/60 p-4">
                <p className="font-semibold">Assign template</p>
                <form action={assignTemplateFromLibraryAction} className="mt-4 space-y-3">
                  <input name="templateId" type="hidden" value={template.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`athleteId-${template.id}`}>Athlete</Label>
                    <select
                      className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start font-normal")}
                      defaultValue={athletes[0]?.id}
                      id={`athleteId-${template.id}`}
                      name="athleteId"
                    >
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`workoutDate-${template.id}`}>Workout date</Label>
                    <Input defaultValue="2026-07-15" id={`workoutDate-${template.id}`} name="workoutDate" type="date" />
                  </div>
                  <Button className="w-full" type="submit">
                    Assign to athlete
                  </Button>
                </form>
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
