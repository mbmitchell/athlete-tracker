import { formatIsoDate } from "@/lib/workouts/date";

import {
  supportedImportItemTypes,
  type ImportItemType,
  type ParseIssue,
  type ParsedDay,
  type ParsedItem,
  type ParsedPlan,
  type ParsedSection
} from "@/lib/import-plan/types";

function makeId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

function pushIssue(
  collection: ParseIssue[],
  lineNumber: number,
  field: string,
  message: string,
  originalLine: string
) {
  collection.push({
    lineNumber,
    field,
    message,
    originalLine
  });
}

function normalizeLabel(label: string) {
  return label.trim().replace(/\s+/g, " ").toUpperCase();
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();

  if (["true", "yes", "y", "1", "required"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "n", "0", "optional"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseIsoDate(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const normalized = formatIsoDate(trimmed);
  return normalized === trimmed ? trimmed : null;
}

function parseImportItemType(value: string): ImportItemType | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return supportedImportItemTypes.find((itemType) => itemType === normalized) ?? null;
}

export function parseImportedPlan(input: string): ParsedPlan {
  const lines = input.split(/\r?\n/);
  const days: ParsedDay[] = [];
  const warnings: ParseIssue[] = [];
  const errors: ParseIssue[] = [];

  let athleteName: string | undefined;
  let weekStart: string | undefined;
  let weeklyFocus: string | undefined;
  const seenTopLevel = new Set<string>();

  let currentDay: ParsedDay | null = null;
  let currentSection: ParsedSection | null = null;
  let currentItem: ParsedItem | null = null;
  let seenDayFields = new Set<string>();
  let seenSectionFields = new Set<string>();
  let seenItemFields = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const originalLine = lines[index];
    const lineNumber = index + 1;
    const trimmed = originalLine.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");

    if (separatorIndex < 0) {
      pushIssue(errors, lineNumber, "line", "Expected LABEL: value format.", originalLine);
      continue;
    }

    const label = normalizeLabel(trimmed.slice(0, separatorIndex));
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!value && label !== "OBJECTIVE" && label !== "INSTRUCTIONS") {
      pushIssue(errors, lineNumber, label, "A value is required for this field.", originalLine);
    }

    if (label === "ATHLETE" || label === "WEEK START" || label === "WEEKLY FOCUS") {
      if (seenTopLevel.has(label)) {
        pushIssue(errors, lineNumber, label, "Duplicate top-level field.", originalLine);
        continue;
      }

      seenTopLevel.add(label);

      if (label === "ATHLETE") {
        athleteName = value;
      }

      if (label === "WEEKLY FOCUS") {
        weeklyFocus = value;
      }

      if (label === "WEEK START") {
        const parsedDate = parseIsoDate(value);

        if (!parsedDate) {
          pushIssue(errors, lineNumber, label, "Week start must be a valid YYYY-MM-DD date.", originalLine);
        } else {
          weekStart = parsedDate;
        }
      }

      continue;
    }

    if (label === "DAY") {
      const parsedDate = parseIsoDate(value);

      if (!parsedDate) {
        pushIssue(errors, lineNumber, label, "Day must be a valid YYYY-MM-DD date.", originalLine);
      }

      currentDay = {
        id: makeId("day", days.length),
        lineNumber,
        date: parsedDate ?? value,
        sections: []
      };
      days.push(currentDay);
      currentSection = null;
      currentItem = null;
      seenDayFields = new Set();
      seenSectionFields = new Set();
      seenItemFields = new Set();
      continue;
    }

    if (label === "SECTION") {
      if (!currentDay) {
        pushIssue(errors, lineNumber, label, "A DAY field must appear before SECTION.", originalLine);
        continue;
      }

      currentSection = {
        id: makeId("section", currentDay.sections.length),
        lineNumber,
        title: value,
        items: []
      };
      currentDay.sections.push(currentSection);
      currentItem = null;
      seenSectionFields = new Set(["SECTION"]);
      seenItemFields = new Set();
      continue;
    }

    if (label === "ITEM") {
      if (!currentDay) {
        pushIssue(errors, lineNumber, label, "A DAY field must appear before ITEM.", originalLine);
        continue;
      }

      if (!currentSection) {
        pushIssue(errors, lineNumber, label, "A SECTION field must appear before ITEM.", originalLine);
        continue;
      }

      currentItem = {
        id: makeId("item", currentSection.items.length),
        lineNumber,
        name: value
      };
      currentSection.items.push(currentItem);
      seenItemFields = new Set(["ITEM"]);
      continue;
    }

    if (["TITLE", "OBJECTIVE", "ESTIMATED MINUTES"].includes(label)) {
      if (!currentDay) {
        pushIssue(errors, lineNumber, label, "A DAY field must appear before this field.", originalLine);
        continue;
      }

      if (seenDayFields.has(label)) {
        pushIssue(errors, lineNumber, label, "Duplicate day field.", originalLine);
        continue;
      }

      seenDayFields.add(label);

      if (label === "TITLE") {
        currentDay.title = value;
      }

      if (label === "OBJECTIVE") {
        currentDay.objective = value;
      }

      if (label === "ESTIMATED MINUTES") {
        const parsedMinutes = parseInteger(value);

        if (parsedMinutes === null) {
          pushIssue(errors, lineNumber, label, "Estimated minutes must be a whole number.", originalLine);
        } else {
          currentDay.estimatedMinutes = parsedMinutes;
        }
      }

      continue;
    }

    if (
      [
        "TYPE",
        "INSTRUCTIONS",
        "SETS",
        "REPS",
        "LOAD",
        "DURATION",
        "DISTANCE",
        "TARGET",
        "UNIT",
        "REST",
        "REQUIRED",
        "RECORD"
      ].includes(label)
    ) {
      if (!currentItem) {
        pushIssue(errors, lineNumber, label, "An ITEM field must appear before this field.", originalLine);
        continue;
      }

      if (seenItemFields.has(label)) {
        pushIssue(errors, lineNumber, label, "Duplicate item field.", originalLine);
        continue;
      }

      seenItemFields.add(label);

      if (label === "TYPE" || label === "RECORD") {
        const parsedType = parseImportItemType(value);

        if (!parsedType) {
          pushIssue(
            errors,
            lineNumber,
            label,
            `Unsupported item type. Supported values: ${supportedImportItemTypes.join(", ")}.`,
            originalLine
          );
        } else if (label === "TYPE") {
          currentItem.type = parsedType;
        } else {
          currentItem.record = parsedType;
        }

        continue;
      }

      if (label === "REQUIRED") {
        const parsedRequired = parseBoolean(value);

        if (parsedRequired === null) {
          pushIssue(errors, lineNumber, label, "Required must be yes/no or true/false.", originalLine);
        } else {
          currentItem.required = parsedRequired;
        }

        continue;
      }

      if (label === "INSTRUCTIONS") {
        currentItem.instructions = value;
      }

      if (label === "SETS") {
        currentItem.sets = value;
      }

      if (label === "REPS") {
        currentItem.reps = value;
      }

      if (label === "LOAD") {
        currentItem.load = value;
      }

      if (label === "DURATION") {
        currentItem.duration = value;
      }

      if (label === "DISTANCE") {
        currentItem.distance = value;
      }

      if (label === "TARGET") {
        currentItem.target = value;
      }

      if (label === "UNIT") {
        currentItem.unit = value;
      }

      if (label === "REST") {
        currentItem.rest = value;
      }

      continue;
    }

    pushIssue(errors, lineNumber, label, "Unrecognized field. Use one of the supported labels.", originalLine);
  }

  for (const day of days) {
    if (!day.title) {
      pushIssue(warnings, day.lineNumber, "TITLE", "Workout title was not provided.", `DAY: ${day.date ?? ""}`);
    }

    if (day.sections.length === 0) {
      pushIssue(warnings, day.lineNumber, "SECTION", "This day has no sections.", `DAY: ${day.date ?? ""}`);
    }

    for (const section of day.sections) {
      if (!section.title) {
        pushIssue(warnings, section.lineNumber, "SECTION", "Section title was not provided.", `SECTION:`);
      }

      for (const item of section.items) {
        if (!item.name) {
          pushIssue(errors, item.lineNumber, "ITEM", "Item value is required.", "ITEM:");
        }

        if (!item.type) {
          pushIssue(warnings, item.lineNumber, "TYPE", "Type was not provided. Text tracking will be used.", `ITEM: ${item.name ?? ""}`);
        }
      }
    }
  }

  return {
    athleteName,
    weekStart,
    weeklyFocus,
    days,
    warnings,
    errors
  };
}
