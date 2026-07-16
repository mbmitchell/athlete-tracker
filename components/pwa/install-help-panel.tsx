import { Download, Share2, Smartphone } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InstallHelpPanelProps = {
  compact?: boolean;
};

export function InstallHelpPanel({ compact = false }: InstallHelpPanelProps) {
  return (
    <details className="group section-card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Add Athlete Hub to your phone</p>
            <p className="text-xs text-muted-foreground">
              Install it to your home screen for a cleaner, app-like workout experience.
            </p>
          </div>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground transition group-open:bg-primary group-open:text-primary-foreground">
          Open
        </div>
      </summary>
      <div className="border-t border-border px-5 pb-5 pt-4">
        <div className={`grid gap-4 ${compact ? "" : "lg:grid-cols-2"}`}>
          <Card className="border border-border/80 shadow-none">
            <CardHeader className="gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Share2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">iPhone</CardTitle>
              <CardDescription>Use Safari for the best Add to Home Screen experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Open this site in Safari</p>
              <p>2. Tap Share</p>
              <p>3. Tap Add to Home Screen</p>
              <p>4. Tap Add</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 shadow-none">
            <CardHeader className="gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Download className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Android</CardTitle>
              <CardDescription>Chrome will offer the cleanest install flow when requirements are met.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Open this site in Chrome</p>
              <p>2. Open the browser menu</p>
              <p>3. Tap Install app or Add to Home screen</p>
              <p>4. Confirm</p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Athlete Hub uses the normal Supabase session cookies already built into the app. Signing out removes access on that device without any custom token storage.
        </p>
      </div>
    </details>
  );
}
