import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

import { getAppUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "Athlete Development Hub",
    template: "%s | Athlete Development Hub"
  },
  description: "Mobile-first training operations for admins, athletes, and parents.",
  applicationName: "Athlete Development Hub",
  appleWebApp: {
    capable: true,
    title: "Athlete Dev Hub",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f4c81"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
