import { redirect } from "next/navigation";

import { resolveDefaultPathForRole } from "@/lib/auth/roles";
import { getAppViewer } from "@/lib/auth/session";

export default async function HomePage() {
  const viewer = await getAppViewer();

  if (!viewer) {
    redirect("/login");
  }

  redirect(resolveDefaultPathForRole(viewer.role));
}
