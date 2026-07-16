import type { AssignedWorkoutItem } from "@/lib/types/domain";

export type WorkoutProgressSummary = {
  completedRequired: number;
  totalRequired: number;
  completedOptional: number;
  totalOptional: number;
  percent: number;
  requiredComplete: boolean;
};

export function calculateWorkoutProgress(items: AssignedWorkoutItem[]): WorkoutProgressSummary {
  const summary = items.reduce(
    (accumulator, item) => {
      const isCompleted = Boolean(item.result?.completed);

      if (item.required) {
        accumulator.totalRequired += 1;
        if (isCompleted) {
          accumulator.completedRequired += 1;
        }
      } else {
        accumulator.totalOptional += 1;
        if (isCompleted) {
          accumulator.completedOptional += 1;
        }
      }

      return accumulator;
    },
    {
      completedRequired: 0,
      totalRequired: 0,
      completedOptional: 0,
      totalOptional: 0
    }
  );

  const totalItems = summary.totalRequired + summary.totalOptional;
  const completedItems = summary.completedRequired + summary.completedOptional;

  return {
    ...summary,
    percent: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
    requiredComplete: summary.totalRequired === 0 || summary.completedRequired === summary.totalRequired
  };
}
