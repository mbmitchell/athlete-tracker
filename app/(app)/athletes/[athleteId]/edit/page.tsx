import { redirect } from "next/navigation";

import { AthleteForm } from "@/components/athletes/athlete-form";
import { getAppViewer } from "@/lib/auth/session";
import { getAthleteByIdForViewer } from "@/lib/data/athletes";

type EditAthletePageProps = {
  params: Promise<{ athleteId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditAthletePage({ params, searchParams }: EditAthletePageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const { athleteId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const athlete = await getAthleteByIdForViewer(viewer, athleteId);

  if (!athlete) {
    redirect("/athletes");
  }

  return (
    <AthleteForm
      athlete={athlete}
      feedback={{
        error: typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : undefined,
        status: typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : undefined
      }}
      mode="edit"
    />
  );
}
