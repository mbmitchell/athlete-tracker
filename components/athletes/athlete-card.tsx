import Link from "next/link";
import { ArrowUpRight, Activity, GraduationCap, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardCard } from "@/lib/types/domain";
import { getWeekStartIso } from "@/lib/workouts/date";
import { cn } from "@/lib/utils";

const statusBadgeMap = {
  draft: "outline",
  published: "secondary",
  completed: "success",
  in_progress: "warning",
  skipped: "destructive",
  not_assigned: "outline"
} as const;

const readinessBadgeMap = {
  ready: "success",
  monitor: "warning",
  recover: "destructive",
  unknown: "outline"
} as const;

type AthleteCardProps = {
  card: AdminDashboardCard;
};

export function AthleteCard({ card }: AthleteCardProps) {
  const weekStart = getWeekStartIso(new Date().toISOString().slice(0, 10));

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{card.athleteName}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Class of {card.graduationYear}</p>
          </div>
          <Link className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground" href={`/athletes/${card.athleteId}/edit`}>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {card.positions.map((position) => (
            <Badge key={position} variant="secondary">
              {position}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              Today
            </div>
            <Badge variant={statusBadgeMap[card.todayCompletionStatus]}>{card.todayCompletionStatus.replaceAll("_", " ")}</Badge>
          </div>
          <div className="rounded-2xl bg-muted/70 p-3">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              Readiness
            </div>
            <Badge variant={readinessBadgeMap[card.latestReadinessStatus]}>{card.latestReadinessStatus}</Badge>
          </div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Development focus</p>
          <p className="mt-2 font-medium text-sky-950">{card.currentDevelopmentFocus}</p>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border px-3 py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Latest body weight
          </div>
          <span className="font-semibold">{card.latestBodyWeight}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link className={cn(buttonVariants({ size: "sm" }), "w-full")} href={`/athletes/${card.athleteId}/weeks/${weekStart}`}>
            Open week
          </Link>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full")}
            href={`/athletes/${card.athleteId}/import-plan?weekStart=${weekStart}`}
          >
            Import plan
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
