import { describe, expect, it } from "vitest";

import { mockExerciseLibrary } from "@/lib/data/mock-data";
import {
  buildImportPreviewPlan,
  matchExerciseByName,
  resolveImportConflicts
} from "@/lib/import-plan/matching";
import {
  buildAssignedWorkoutSnapshotFromImportDay,
  buildImportExecutionPlan,
  validateImportPreviewPlanForWeek
} from "@/lib/import-plan/planning";
import { parseImportedPlan } from "@/lib/import-plan/parser";

const sourceText = `ATHLETE: Colt Ramirez
WEEK START: 2026-07-20
WEEKLY FOCUS: Rotational power and transfer speed

DAY: 2026-07-20
TITLE: Force day
OBJECTIVE: Build lower-body force.
ESTIMATED MINUTES: 70
SECTION: Prep
ITEM: Dynamic warm-up
TYPE: duration
DURATION: 600
UNIT: seconds
REQUIRED: yes
RECORD: checkbox
SECTION: Strength
ITEM: Trap bar deadlift
TYPE: sets_reps_weight
SETS: 4
REPS: 4
LOAD: 315 lb
REST: 120

DAY: 2026-07-22
TITLE: Catch and throw
OBJECTIVE: Train transfer speed.
ESTIMATED MINUTES: 45
SECTION: Throwing
ITEM: Timed catcher throws
TYPE: duration
DURATION: 8
UNIT: reps
TARGET: 1.95
RECORD: duration
`;

describe("import plan parser", () => {
  it("parses a structured plan without errors", () => {
    const parsed = parseImportedPlan(sourceText);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.weekStart).toBe("2026-07-20");
    expect(parsed.days).toHaveLength(2);
    expect(parsed.days[0].sections[1].items[0].name).toBe("Trap bar deadlift");
  });

  it("flags unsupported labels and missing context", () => {
    const parsed = parseImportedPlan(`ITEM: Sprint work\nSPEED: fast`);

    expect(parsed.errors.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "A DAY field must appear before ITEM.",
        "Unrecognized field. Use one of the supported labels."
      ])
    );
  });

  it("does not validate RECORD values as import types", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: 2026-07-15
SECTION: Hitting
ITEM: Blast swings
TYPE: numeric
RECORD: best bat speed, average bat speed`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].sections[0].items[0].record).toBe("best bat speed, average bat speed");
    expect(parsed.days[0].sections[0].items[0].recordValues).toEqual([
      "best bat speed",
      "average bat speed"
    ]);
  });

  it("supports a single RECORD value", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: 2026-07-15
SECTION: Speed
ITEM: 10-yard start
TYPE: duration
RECORD: best 10-yard time`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].sections[0].items[0].record).toBe("best 10-yard time");
    expect(parsed.days[0].sections[0].items[0].recordValues).toEqual(["best 10-yard time"]);
  });

  it("supports multiple comma-separated RECORD values while preserving order", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: 2026-07-15
SECTION: Hitting
ITEM: Exit velocity round
TYPE: velocity
RECORD: best exit velocity, average exit velocity, total hard line drives`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].sections[0].items[0].recordValues).toEqual([
      "best exit velocity",
      "average exit velocity",
      "total hard line drives"
    ]);
  });

  it("resolves weekday names from WEEK START", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: Wednesday
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].date).toBe("2026-07-15");
  });

  it("matches weekday names case-insensitively", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: wEdNeSdAy
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].date).toBe("2026-07-15");
  });

  it("supports abbreviated weekday names", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: Thu
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].date).toBe("2026-07-16");
  });

  it("returns an error when a weekday DAY appears before WEEK START", () => {
    const parsed = parseImportedPlan(`DAY: Wednesday
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration
WEEK START: 2026-07-13`);

    expect(parsed.errors.map((issue) => issue.message)).toContain(
      "A valid WEEK START must appear before using weekday names in DAY."
    );
  });

  it("returns an error for an invalid weekday", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: Funday
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration`);

    expect(parsed.errors.map((issue) => issue.message)).toContain(
      "Day must be a valid YYYY-MM-DD date or a weekday name between Monday and Sunday."
    );
  });

  it("continues to support exact YYYY-MM-DD day values", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: 2026-07-15
SECTION: Recovery
ITEM: Recovery breathing
TYPE: duration`);

    expect(parsed.errors).toHaveLength(0);
    expect(parsed.days[0].date).toBe("2026-07-15");
  });
});

describe("import plan matching", () => {
  it("matches exercise names after punctuation normalization", () => {
    const match = matchExerciseByName("Trap bar deadlift", mockExerciseLibrary);

    expect(match?.id).toBe("exercise-trap-bar-deadlift");
  });

  it("prefers library default result tracking when a match exists", () => {
    const parsed = parseImportedPlan(sourceText);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-20",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    expect(preview.days[1].sections[0].items[0].matchedExerciseId).toBe("exercise-timed-catcher-throws");
    expect(preview.days[1].sections[0].items[0].resultEntryType).toBe("duration");
    expect(preview.days[0].sections[1].items[0].matchedExerciseId).toBe("exercise-trap-bar-deadlift");
    expect(preview.days[0].sections[1].items[0].resultEntryType).toBe("sets_reps_weight");
  });

  it("preserves RECORD text in preview instructions when the data model supports only one result definition", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: Wednesday
SECTION: Hitting
ITEM: Blast Motion measured swings
TYPE: numeric
INSTRUCTIONS: Stay on time through contact.
RECORD: best bat speed, average bat speed`);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-13",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    const item = preview.days[0].sections[0].items[0];

    expect(item.recordTracking).toBe("best bat speed, average bat speed");
    expect(item.recordTrackingValues).toEqual(["best bat speed", "average bat speed"]);
    expect(item.instructions).toContain("Stay on time through contact.");
    expect(item.instructions).toContain("Record: best bat speed, average bat speed");
  });
});

describe("import plan validation and conflict handling", () => {
  it("rejects duplicate or out-of-week dates", () => {
    const parsed = parseImportedPlan(sourceText);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-20",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    preview.days[1].date = "2026-07-29";
    preview.days.push({
      ...preview.days[0],
      id: "duplicate-day"
    });

    expect(validateImportPreviewPlanForWeek(preview, "2026-07-20")).toEqual(
      expect.arrayContaining([
        "Imported day 2026-07-29 is outside the selected week starting 2026-07-20.",
        "Imported day 2026-07-20 appears more than once."
      ])
    );
  });

  it("classifies replaceable and protected conflicts", () => {
    const parsed = parseImportedPlan(sourceText);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-20",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    const conflicts = resolveImportConflicts({
      days: preview.days,
      existingWorkouts: [
        {
          id: "draft-workout",
          workoutDate: "2026-07-20",
          title: "Old draft",
          status: "draft",
          hasResults: false
        },
        {
          id: "published-workout",
          workoutDate: "2026-07-22",
          title: "Published day",
          status: "published",
          hasResults: false
        }
      ]
    });

    expect(conflicts[0].allowReplaceDraft).toBe(true);
    expect(conflicts[1].allowReplaceDraft).toBe(false);
    expect(conflicts[1].blockingReason).toBe("Only draft workouts without athlete progress can be replaced.");
  });

  it("builds a mixed execution plan for create and replace flows", () => {
    const parsed = parseImportedPlan(sourceText);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-20",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });
    const conflicts = resolveImportConflicts({
      days: preview.days,
      existingWorkouts: [
        {
          id: "draft-workout",
          workoutDate: "2026-07-20",
          title: "Old draft",
          status: "draft",
          hasResults: false
        }
      ]
    });

    const executionPlan = buildImportExecutionPlan({
      days: preview.days,
      conflicts,
      strategy: "replace_selected_drafts",
      replaceWorkoutIds: ["draft-workout"]
    });

    expect(executionPlan.replaceDays).toHaveLength(1);
    expect(executionPlan.createDays).toHaveLength(1);
    expect(executionPlan.skippedDays).toHaveLength(0);
    expect(executionPlan.blockingErrors).toHaveLength(0);
  });
});

describe("import snapshot mapping", () => {
  it("converts a preview day into an assigned workout snapshot", () => {
    const parsed = parseImportedPlan(sourceText);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-20",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    const snapshot = buildAssignedWorkoutSnapshotFromImportDay({
      athleteId: "athlete-colt",
      trainingWeekId: "week-2026-07-20",
      day: preview.days[0]
    });

    expect(snapshot.workoutDate).toBe("2026-07-20");
    expect(snapshot.sections[0].items[0].prescribedDurationSeconds).toBe("600");
    expect(snapshot.sections[1].items[0].sourceExerciseId).toBe("exercise-trap-bar-deadlift");
  });

  it("preserves RECORD details in the saved snapshot instructions", () => {
    const parsed = parseImportedPlan(`WEEK START: 2026-07-13
DAY: Wednesday
SECTION: Testing
ITEM: Vertical jump
TYPE: numeric
RECORD: best vertical jump, average vertical jump`);
    const preview = buildImportPreviewPlan({
      athleteId: "athlete-colt",
      athleteName: "Colt Ramirez",
      fallbackWeekStart: "2026-07-13",
      parsedPlan: parsed,
      exercises: mockExerciseLibrary
    });

    const snapshot = buildAssignedWorkoutSnapshotFromImportDay({
      athleteId: "athlete-colt",
      trainingWeekId: "week-2026-07-13",
      day: preview.days[0]
    });

    expect(snapshot.sections[0].items[0].instructions).toBe(
      "Record: best vertical jump, average vertical jump"
    );
  });
});
