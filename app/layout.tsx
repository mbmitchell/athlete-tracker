import type { Metadata, Viewport } from "next";

import "@/app/globals.css";

import { getAppUrl } from "@/lib/env";
import { pwaTheme } from "@/lib/pwa/branding";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  manifest: "/manifest.webmanifest",
  title: {
    default: "Athlete Development Hub",
    template: "%s | Athlete Development Hub"
  },
  description: "Mobile-first training operations for admins, athletes, and parents.",
  applicationName: "Athlete Development Hub",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "128x128" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/icon", type: "image/png", sizes: "128x128" }]
  },
  appleWebApp: {
    capable: true,
    title: "Athlete Hub",
    statusBarStyle: "black-translucent"
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: pwaTheme.background
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
