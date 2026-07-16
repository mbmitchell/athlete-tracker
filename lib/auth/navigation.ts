import type { NavigationItem, UserRole } from "@/lib/types/domain";

export function getNavigationItems(role: UserRole): NavigationItem[] {
  const today = new Date().toISOString().slice(0, 10);

  if (role === "admin") {
    return [
      { href: "/admin", label: "Dashboard", icon: "home" },
      { href: "/athletes", label: "Athletes", icon: "users" },
      { href: "/calendar", label: "Calendar", icon: "calendar" },
      { href: "/library/exercises", label: "Library", icon: "book" }
    ];
  }

  if (role === "parent") {
    return [
      { href: "/athletes", label: "Athletes", icon: "users" },
      { href: "/calendar", label: "Calendar", icon: "calendar" },
      { href: `/workouts/${today}`, label: "Today", icon: "clipboard" }
    ];
  }

  return [
    { href: "/athlete", label: "Dashboard", icon: "home" },
    { href: "/calendar", label: "Calendar", icon: "calendar" },
    { href: `/workouts/${today}`, label: "Today", icon: "clipboard" }
  ];
}
