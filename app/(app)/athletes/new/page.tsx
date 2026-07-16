import { redirect } from "next/navigation";

import { AthleteForm } from "@/components/athletes/athlete-form";
import { getAppViewer } from "@/lib/auth/session";

export default async function NewAthletePage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect("/");
  }

  return <AthleteForm mode="create" />;
}
