import { redirect } from "next/navigation";

import { AthleteForm } from "@/components/athletes/athlete-form";
import { getAppViewer } from "@/lib/auth/session";

type NewAthletePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAthletePage({ searchParams }: NewAthletePageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <AthleteForm
      feedback={{
        error: typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : undefined,
        status: typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : undefined
      }}
      mode="create"
    />
  );
}
