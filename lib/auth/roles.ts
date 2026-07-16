import type { UserRole } from "@/lib/types/domain";

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin / Trainer",
  athlete: "Athlete",
  parent: "Parent"
};

export function resolveDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "athlete":
      return "/athlete";
    case "parent":
      return "/athletes";
    default:
      return "/login";
  }
}
