"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="page-shell min-h-screen">
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle>Application setup or data error</CardTitle>
              <CardDescription>
                Athlete Development Hub is configured to use Supabase, but a required environment value or database operation failed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                {error.message || "An unexpected application error occurred."}
              </div>
              <Button onClick={reset} type="button">
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
