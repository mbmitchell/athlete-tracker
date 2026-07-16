import { redirect } from "next/navigation";

import { WeekPlanner } from "@/components/planning/week-planner";
import { getAppViewer } from "@/lib/auth/session";
import { getWorkoutTemplatesForViewer } from "@/lib/data/library";
import { getTrainingWeekForAdmin } from "@/lib/data/workouts";

type AthleteWeekPageProps = {
  params: Promise<{ athleteId: string; weekStart: string }>;
};

export default async function AthleteWeekPage({ params }: AthleteWeekPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const { athleteId, weekStart } = await params;
  const [week, templates] = await Promise.all([
    getTrainingWeekForAdmin(viewer, athleteId, weekStart),
    getWorkoutTemplatesForViewer(viewer)
  ]);

  if (!week) {
    redirect("/athletes");
  }

  return <WeekPlanner templates={templates} week={week} />;
}
