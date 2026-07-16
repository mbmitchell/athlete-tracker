"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { startTransition, useState } from "react";
import { AlertTriangle, Copy, FileStack, RefreshCcw, Save, Sparkles, Trash2 } from "lucide-react";

import { saveImportedPlanAction } from "@/app/actions/workouts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildImportPreviewPlan, resolveImportConflicts } from "@/lib/import-plan/matching";
import {
  buildImportExecutionPlan,
  type ImportSaveStrategy,
  validateImportPreviewPlanForWeek
} from "@/lib/import-plan/planning";
import { parseImportedPlan } from "@/lib/import-plan/parser";
import { importPlanTemplate } from "@/lib/import-plan/template";
import {
  supportedImportItemTypes,
  supportedImportLabels,
  type ExistingImportWorkout,
  type ImportPreviewDay,
  type ImportPreviewItem,
  type ImportPreviewPlan,
  type ImportPreviewSection,
  type ParseIssue
} from "@/lib/import-plan/types";
import type { ExerciseLibraryEntry, WorkoutResultType } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

type ImportPlanManagerProps = {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
  };
  exercises: ExerciseLibraryEntry[];
  existingWorkouts: ExistingImportWorkout[];
  initialWeekStart: string;
};

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const resultTypeOptions: WorkoutResultType[] = [
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

function updateDayInPlan(
  plan: ImportPreviewPlan,
  dayId: string,
  updater: (day: ImportPreviewDay) => ImportPreviewDay
) {
  return {
    ...plan,
    days: plan.days.map((day) => (day.id === dayId ? updater(day) : day))
  };
}

function updateSectionInPlan(
  plan: ImportPreviewPlan,
  dayId: string,
  sectionId: string,
  updater: (section: ImportPreviewSection) => ImportPreviewSection
) {
  return updateDayInPlan(plan, dayId, (day) => ({
    ...day,
    sections: day.sections.map((section) => (section.id === sectionId ? updater(section) : section))
  }));
}

function updateItemInPlan(
  plan: ImportPreviewPlan,
  dayId: string,
  sectionId: string,
  itemId: string,
  updater: (item: ImportPreviewItem) => ImportPreviewItem
) {
  return updateSectionInPlan(plan, dayId, sectionId, (section) => ({
    ...section,
    items: section.items.map((item) => (item.id === itemId ? updater(item) : item))
  }));
}

function bannerToneClass(tone: "error" | "success" | "info") {
  if (tone === "error") {
    return "bg-rose-50 text-rose-700";
  }

  if (tone === "success") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-sky-50 text-sky-700";
}

export function ImportPlanManager({
  athlete,
  exercises,
  existingWorkouts,
  initialWeekStart
}: ImportPlanManagerProps) {
  const router = useRouter();
  const athleteName = `${athlete.firstName} ${athlete.lastName}`;
  const [rawText, setRawText] = useState(importPlanTemplate);
  const [selectedWeekStart, setSelectedWeekStart] = useState(initialWeekStart);
  const [preview, setPreview] = useState<ImportPreviewPlan | null>(null);
  const [parseFeedback, setParseFeedback] = useState<{ tone: "error" | "success" | "info"; message: string } | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<ImportSaveStrategy>("create_missing_days_only");
  const [replaceWorkoutIds, setReplaceWorkoutIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const conflicts = preview
    ? resolveImportConflicts({
        days: preview.days,
        existingWorkouts
      })
    : [];
  const validationErrors = preview ? validateImportPreviewPlanForWeek(preview, selectedWeekStart) : [];
  const executionPlan = preview
    ? buildImportExecutionPlan({
        days: preview.days,
        conflicts,
        strategy,
        replaceWorkoutIds
      })
    : null;
  const parserWeekMismatch =
    preview?.weekStart && preview.weekStart !== selectedWeekStart
      ? `The pasted plan references ${preview.weekStart}, but the selected save week is ${selectedWeekStart}.`
      : null;
  const saveDisabled =
    !preview ||
    preview.errors.length > 0 ||
    validationErrors.length > 0 ||
    Boolean(executionPlan && executionPlan.blockingErrors.length > 0) ||
    isSaving;

  function handleParse() {
    const parsed = parseImportedPlan(rawText);
    const nextPreview = buildImportPreviewPlan({
      athleteId: athlete.id,
      athleteName,
      fallbackWeekStart: selectedWeekStart,
      parsedPlan: parsed,
      exercises
    });

    setPreview(nextPreview);
    setReplaceWorkoutIds([]);
    setSaveFeedback(null);

    if (parsed.errors.length > 0) {
      setParseFeedback({
        tone: "error",
        message: `Parsed with ${parsed.errors.length} error${parsed.errors.length === 1 ? "" : "s"}. Fix the source text and parse again before saving.`
      });
      return;
    }

    setParseFeedback({
      tone: "success",
      message: `Preview ready for ${nextPreview.days.length} day${nextPreview.days.length === 1 ? "" : "s"}.`
    });
  }

  async function handleCopyTemplate() {
    try {
      await navigator.clipboard.writeText(importPlanTemplate);
      setCopyFeedback("Template copied.");
    } catch {
      setCopyFeedback("Clipboard access was blocked. Copy the template from the panel below.");
    }
  }

  function handleExerciseChange(dayId: string, sectionId: string, itemId: string, exerciseId: string) {
    if (!preview) {
      return;
    }

    const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId) ?? null;

    setPreview(
      updateItemInPlan(preview, dayId, sectionId, itemId, (item) => ({
        ...item,
        matchedExerciseId: selectedExercise?.id ?? null,
        matchedExerciseName: selectedExercise?.name ?? null,
        matchStatus: selectedExercise ? "matched" : "custom",
        name: selectedExercise?.name ?? item.name,
        instructions: item.instructions || selectedExercise?.coachingCues || "",
        resultEntryType: selectedExercise?.defaultUnitType ?? item.resultEntryType
      }))
    );
  }

  function toggleReplacement(workoutId: string, checked: boolean) {
    setReplaceWorkoutIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, workoutId]));
      }

      return current.filter((id) => id !== workoutId);
    });
  }

  function updatePreview(nextPreview: ImportPreviewPlan) {
    setPreview(nextPreview);
    setSaveFeedback(null);
  }

  function updatePreviewDay(dayId: string, updater: (day: ImportPreviewDay) => ImportPreviewDay) {
    if (!preview) {
      return;
    }

    updatePreview(updateDayInPlan(preview, dayId, updater));
  }

  function updatePreviewSection(
    dayId: string,
    sectionId: string,
    updater: (section: ImportPreviewSection) => ImportPreviewSection
  ) {
    if (!preview) {
      return;
    }

    updatePreview(updateSectionInPlan(preview, dayId, sectionId, updater));
  }

  function updatePreviewItem(
    dayId: string,
    sectionId: string,
    itemId: string,
    updater: (item: ImportPreviewItem) => ImportPreviewItem
  ) {
    if (!preview) {
      return;
    }

    updatePreview(updateItemInPlan(preview, dayId, sectionId, itemId, updater));
  }

  function removeDay(dayId: string) {
    if (!preview) {
      return;
    }

    updatePreview({
      ...preview,
      days: preview.days.filter((day) => day.id !== dayId)
    });
  }

  function removeSection(dayId: string, sectionId: string) {
    updatePreviewDay(dayId, (day) => ({
      ...day,
      sections: day.sections.filter((section) => section.id !== sectionId)
    }));
  }

  function removeItem(dayId: string, sectionId: string, itemId: string) {
    updatePreviewSection(dayId, sectionId, (section) => ({
      ...section,
      items: section.items.filter((item) => item.id !== itemId)
    }));
  }

  async function handleSave() {
    if (!preview || saveDisabled) {
      return;
    }

    setIsSaving(true);
    setSaveFeedback(null);

    startTransition(async () => {
      const result = await saveImportedPlanAction({
        athleteId: athlete.id,
        weekStart: selectedWeekStart,
        weeklyFocus: preview.weeklyFocus,
        strategy,
        replaceWorkoutIds,
        plan: {
          ...preview,
          athleteId: athlete.id,
          athleteName,
          weekStart: selectedWeekStart
        }
      });

      setIsSaving(false);

      if (!result.ok) {
        setSaveFeedback({
          tone: "error",
          message: result.error
        });
        return;
      }

      router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pill-label">Import plan</p>
          <h2 className="mt-2 text-2xl font-semibold">{athleteName}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste a structured week plan, clean up the preview, then save draft workouts into the selected week.
          </p>
        </div>
        <div className="w-full rounded-3xl border border-border bg-muted/40 p-4 lg:max-w-sm">
          <Label htmlFor="selectedWeekStart">Week start</Label>
          <Input
            id="selectedWeekStart"
            value={selectedWeekStart}
            onChange={(event) => setSelectedWeekStart(event.target.value)}
            type="date"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            This selected week is the authoritative save target, even if the pasted text includes a different `WEEK START`.
          </p>
        </div>
      </section>

      {parseFeedback ? (
        <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass(parseFeedback.tone))}>
          {parseFeedback.message}
        </div>
      ) : null}
      {saveFeedback ? (
        <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass(saveFeedback.tone))}>
          {saveFeedback.message}
        </div>
      ) : null}
      {copyFeedback ? (
        <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass("info"))}>{copyFeedback}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Paste source text</CardTitle>
            <CardDescription>
              The parser supports labeled lines only. Keep one field per line and re-parse after edits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-[420px] font-mono text-xs sm:text-sm"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="sm:flex-1" onClick={handleParse} size="lg">
                <FileStack className="mr-2 h-4 w-4" />
                Parse import text
              </Button>
              <Button onClick={handleCopyTemplate} size="lg" variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy import template
              </Button>
            </div>
          </CardContent>
        </Card>

        {preview?.errors.length ? (
          <Card className="border-rose-200 bg-rose-50/70">
            <CardHeader>
              <CardTitle className="text-rose-900">Current parser errors</CardTitle>
              <CardDescription className="text-rose-700">
                {preview.errors.length} error{preview.errors.length === 1 ? "" : "s"} found in the pasted plan. Fix these lines, then parse again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preview.errors.map((issue, index) => (
                  <div className="rounded-2xl border border-rose-200 bg-white p-3 text-sm" key={`${issue.lineNumber}-${issue.field}-${index}`}>
                    <p className="font-semibold text-rose-900">
                      Line {issue.lineNumber} · {issue.field}
                    </p>
                    <p className="mt-1 text-rose-800">{issue.message}</p>
                    <p className="mt-2 font-mono text-xs text-rose-700">{issue.originalLine || "(blank line)"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template help</CardTitle>
              <CardDescription>Use these supported labels exactly as written.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                {supportedImportLabels.map((label) => (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold" key={label}>
                    {label}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Supported item types
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{supportedImportItemTypes.join(", ")}</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-4 text-[11px] text-slate-100 sm:text-xs">
                <pre className="overflow-x-auto whitespace-pre-wrap">{importPlanTemplate}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save rules</CardTitle>
              <CardDescription>Imports only create draft workouts. Existing athlete progress is never overwritten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Completed, in-progress, or result-bearing days are blocked and stay untouched.</p>
              <p>Only draft workouts without athlete progress can be replaced.</p>
              <p>New workouts save into the selected week and reuse your current authenticated admin session.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {preview ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Preview summary</CardTitle>
                <CardDescription>Review parser issues, week alignment, and conflict handling before saving.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryPill label="Days" value={String(preview.days.length)} />
                  <SummaryPill label="Warnings" value={String(preview.warnings.length)} />
                  <SummaryPill label="Errors" value={String(preview.errors.length)} />
                </div>

                {parserWeekMismatch ? (
                  <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass("info"))}>{parserWeekMismatch}</div>
                ) : null}

                {preview.errors.length > 0 ? <IssueList issues={preview.errors} title="Parser errors" tone="error" /> : null}
                {preview.warnings.length > 0 ? (
                  <IssueList issues={preview.warnings} title="Parser warnings" tone="info" />
                ) : null}
                {validationErrors.length > 0 ? (
                  <SimpleIssueList issues={validationErrors} title="Preview validation" tone="error" />
                ) : null}
                {executionPlan && executionPlan.blockingErrors.length > 0 ? (
                  <SimpleIssueList issues={executionPlan.blockingErrors} title="Import blocking issues" tone="error" />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conflict handling</CardTitle>
                <CardDescription>
                  Choose whether to import only open days or also replace selected draft workouts without results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <label className="rounded-2xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <input
                        checked={strategy === "create_missing_days_only"}
                        className="mt-1"
                        name="strategy"
                        onChange={() => setStrategy("create_missing_days_only")}
                        type="radio"
                      />
                      <div>
                        <p className="font-semibold">Create only missing days</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Existing workouts stay in place. Only open dates from this import will be created.
                        </p>
                      </div>
                    </div>
                  </label>
                  <label className="rounded-2xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <input
                        checked={strategy === "replace_selected_drafts"}
                        className="mt-1"
                        name="strategy"
                        onChange={() => setStrategy("replace_selected_drafts")}
                        type="radio"
                      />
                      <div>
                        <p className="font-semibold">Replace selected draft workouts</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Only draft workouts with no athlete progress can be replaced.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {conflicts.length > 0 ? (
                  <div className="space-y-3">
                    {conflicts.map((conflict) => (
                      <div className="rounded-2xl border border-border p-4" key={conflict.existingWorkoutId}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold">{conflict.date}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Existing workout: {conflict.title} · {conflict.status.replaceAll("_", " ")}
                            </p>
                            <p className="mt-2 text-sm">
                              {conflict.blockingReason ?? "This day is occupied. You can only replace it if it is still a clean draft."}
                            </p>
                          </div>
                          {conflict.allowReplaceDraft ? (
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                checked={replaceWorkoutIds.includes(conflict.existingWorkoutId)}
                                onChange={(event) => toggleReplacement(conflict.existingWorkoutId, event.target.checked)}
                                type="checkbox"
                              />
                              Replace draft
                            </label>
                          ) : (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Protected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass("success"))}>
                    No conflicts were found for the current preview dates.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Week details</CardTitle>
              <CardDescription>Adjust the imported focus before saving the draft week.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="weeklyFocus">Weekly focus</Label>
                <Input
                  id="weeklyFocus"
                  value={preview.weeklyFocus}
                  onChange={(event) => updatePreview({ ...preview, weeklyFocus: event.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <div>
              <p className="pill-label">Editable preview</p>
              <h3 className="mt-2 text-xl font-semibold">Review each day before saving</h3>
            </div>
            <div className="space-y-4">
              {preview.days.map((day) => (
                <Card key={day.id}>
                  <CardHeader className="gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>{day.title || "Untitled workout"}</CardTitle>
                        <CardDescription>{day.date}</CardDescription>
                      </div>
                      <Button onClick={() => removeDay(day.id)} size="sm" variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove day
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <FieldGroup label="Date">
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(event) =>
                            updatePreviewDay(day.id, (current) => ({ ...current, date: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup label="Title">
                        <Input
                          value={day.title}
                          onChange={(event) =>
                            updatePreviewDay(day.id, (current) => ({ ...current, title: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup label="Objective">
                        <Input
                          value={day.objective}
                          onChange={(event) =>
                            updatePreviewDay(day.id, (current) => ({ ...current, objective: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup label="Estimated minutes">
                        <Input
                          min={0}
                          type="number"
                          value={day.estimatedMinutes ?? ""}
                          onChange={(event) =>
                            updatePreviewDay(day.id, (current) => ({
                              ...current,
                              estimatedMinutes: event.target.value ? Number(event.target.value) : null
                            }))
                          }
                        />
                      </FieldGroup>
                    </div>

                    <div className="space-y-3">
                      {day.sections.map((section) => (
                        <div className="rounded-3xl border border-border bg-muted/25 p-4" key={section.id}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <FieldGroup className="flex-1" label="Section title">
                              <Input
                                value={section.title}
                                onChange={(event) =>
                                  updatePreviewSection(day.id, section.id, (current) => ({
                                    ...current,
                                    title: event.target.value
                                  }))
                                }
                              />
                            </FieldGroup>
                            <Button onClick={() => removeSection(day.id, section.id)} size="sm" variant="ghost">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove section
                            </Button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {section.items.map((item) => (
                              <div className="rounded-2xl bg-white p-4 shadow-sm" key={item.id}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                      Workout item
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Line {item.lineNumber} · {item.matchStatus === "matched" ? "Matched to library" : "Custom exercise"}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => removeItem(day.id, section.id, item.id)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove item
                                  </Button>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                  <FieldGroup className="sm:col-span-2" label="Exercise match">
                                    <select
                                      className={selectClassName}
                                      value={item.matchedExerciseId ?? "custom"}
                                      onChange={(event) =>
                                        handleExerciseChange(
                                          day.id,
                                          section.id,
                                          item.id,
                                          event.target.value === "custom" ? "" : event.target.value
                                        )
                                      }
                                    >
                                      <option value="custom">Keep as custom exercise</option>
                                      {exercises.map((exercise) => (
                                        <option key={exercise.id} value={exercise.id}>
                                          {exercise.name}
                                        </option>
                                      ))}
                                    </select>
                                  </FieldGroup>
                                  <FieldGroup label="Import type">
                                    <select
                                      className={selectClassName}
                                      value={item.type}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          type: event.target.value as ImportPreviewItem["type"]
                                        }))
                                      }
                                    >
                                      {supportedImportItemTypes.map((type) => (
                                        <option key={type} value={type}>
                                          {type}
                                        </option>
                                      ))}
                                    </select>
                                  </FieldGroup>
                                  <FieldGroup label="Result entry">
                                    <select
                                      className={selectClassName}
                                      value={item.resultEntryType}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          resultEntryType: event.target.value as WorkoutResultType
                                        }))
                                      }
                                    >
                                      {resultTypeOptions.map((resultType) => (
                                        <option key={resultType} value={resultType}>
                                          {resultType}
                                        </option>
                                      ))}
                                    </select>
                                  </FieldGroup>
                                  <FieldGroup className="sm:col-span-2" label="Display name">
                                    <Input
                                      value={item.name}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          name: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup className="sm:col-span-2" label="Instructions">
                                    <Textarea
                                      className="min-h-[110px]"
                                      value={item.instructions}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          instructions: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Sets">
                                    <Input
                                      value={item.sets}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          sets: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Reps">
                                    <Input
                                      value={item.reps}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          reps: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Load">
                                    <Input
                                      value={item.load}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          load: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Duration">
                                    <Input
                                      value={item.duration}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          duration: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Distance">
                                    <Input
                                      value={item.distance}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          distance: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Target">
                                    <Input
                                      value={item.target}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          target: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Unit">
                                    <Input
                                      value={item.unit}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          unit: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Rest">
                                    <Input
                                      value={item.rest}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          rest: event.target.value
                                        }))
                                      }
                                    />
                                  </FieldGroup>
                                  <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm font-medium sm:w-fit">
                                    <input
                                      checked={item.required}
                                      onChange={(event) =>
                                        updatePreviewItem(day.id, section.id, item.id, (current) => ({
                                          ...current,
                                          required: event.target.checked
                                        }))
                                      }
                                      type="checkbox"
                                    />
                                    Required item
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Save imported draft week</CardTitle>
              <CardDescription>
                The import keeps athlete results protected and uses your current authenticated admin session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {executionPlan ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <SummaryPill label="Create" value={String(executionPlan.createDays.length)} />
                  <SummaryPill label="Replace" value={String(executionPlan.replaceDays.length)} />
                  <SummaryPill label="Skip" value={String(executionPlan.skippedDays.length)} />
                </div>
              ) : null}

              {executionPlan && executionPlan.skippedDays.length > 0 ? (
                <div className={cn("rounded-2xl p-4 text-sm", bannerToneClass("info"))}>
                  {executionPlan.skippedDays.length} day{executionPlan.skippedDays.length === 1 ? "" : "s"} will be skipped based on the selected conflict strategy.
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="sm:flex-1" disabled={saveDisabled} onClick={handleSave} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving import..." : "Save draft week"}
                </Button>
                <Link
                  className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                  href={`/athletes/${athlete.id}/weeks/${selectedWeekStart}`}
                >
                  Cancel
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">Parse your source text to generate a preview.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Once parsed, you can edit days, remove items, resolve conflicts, and save the week as drafts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FieldGroup({
  children,
  className,
  label
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function IssueList({
  issues,
  title,
  tone
}: {
  issues: ParseIssue[];
  title: string;
  tone: "error" | "info";
}) {
  return (
    <div className={cn("rounded-2xl p-4", bannerToneClass(tone))}>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <p className="font-semibold">{title}</p>
      </div>
      <div className="space-y-2 text-sm">
        {issues.map((issue, index) => (
          <p key={`${issue.lineNumber}-${issue.field}-${index}`}>
            Line {issue.lineNumber}: {issue.message}
          </p>
        ))}
      </div>
    </div>
  );
}

function SimpleIssueList({
  issues,
  title,
  tone
}: {
  issues: string[];
  title: string;
  tone: "error" | "info";
}) {
  return (
    <div className={cn("rounded-2xl p-4", bannerToneClass(tone))}>
      <div className="mb-3 flex items-center gap-2">
        {tone === "error" ? <AlertTriangle className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
        <p className="font-semibold">{title}</p>
      </div>
      <div className="space-y-2 text-sm">
        {issues.map((issue) => (
          <p key={issue}>{issue}</p>
        ))}
      </div>
    </div>
  );
}
