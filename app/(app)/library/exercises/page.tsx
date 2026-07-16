import { redirect } from "next/navigation";

import { ExerciseLibrary } from "@/components/library/exercise-library";
import { getAppViewer } from "@/lib/auth/session";
import { getExerciseLibraryForViewer } from "@/lib/data/library";

type ExerciseLibraryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExerciseLibraryPage({ searchParams }: ExerciseLibraryPageProps) {
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
  const exercises = await getExerciseLibraryForViewer(viewer);

  return <ExerciseLibrary exercises={exercises} selectedExerciseId={editId} />;
}
