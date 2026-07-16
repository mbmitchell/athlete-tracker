import { redirect } from "next/navigation";

import { AthleteForm } from "@/components/athletes/athlete-form";
import { getAppViewer } from "@/lib/auth/session";
import { getAthleteByIdForViewer } from "@/lib/data/athletes";

type EditAthletePageProps = {
  params: Promise<{ athleteId: string }>;
};

export default async function EditAthletePage({ params }: EditAthletePageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const { athleteId } = await params;
  const athlete = await getAthleteByIdForViewer(viewer, athleteId);

  if (!athlete) {
    redirect("/athletes");
  }

  return <AthleteForm athlete={athlete} mode="edit" />;
}
