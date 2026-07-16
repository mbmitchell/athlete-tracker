"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Home,
  Settings,
  Users,
  type LucideIcon
} from "lucide-react";

import { getNavigationItems } from "@/lib/auth/navigation";
import type { NavigationItem, UserRole } from "@/lib/types/domain";
import { cn } from "@/lib/utils";

const iconMap = {
  home: Home,
  users: Users,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  book: BookOpen,
  settings: Settings
} satisfies Record<NavigationItem["icon"], LucideIcon>;

type MobileNavProps = {
  role: UserRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = getNavigationItems(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/90 px-3 py-3 backdrop-blur sm:hidden">
      <div
        className={cn(
          "mx-auto grid max-w-md gap-2",
          items.length === 4 ? "grid-cols-4" : "grid-cols-3"
        )}
      >
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
