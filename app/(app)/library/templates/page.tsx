import { redirect } from "next/navigation";

import { TemplateLibrary } from "@/components/library/template-library";
import { getAppViewer } from "@/lib/auth/session";
import { getAthleteSummariesForViewer } from "@/lib/data/athletes";
import { getWorkoutTemplatesForViewer } from "@/lib/data/library";

type TemplateLibraryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplateLibraryPage({ searchParams }: TemplateLibraryPageProps) {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const editId =
    typeof resolvedSearchParams?.edit === "string" ? resolvedSearchParams.edit : undefined;
  const [templates, athletes] = await Promise.all([
    getWorkoutTemplatesForViewer(viewer),
    getAthleteSummariesForViewer(viewer)
  ]);

  return <TemplateLibrary athletes={athletes} selectedTemplateId={editId} templates={templates} />;
}
