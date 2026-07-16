import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Athlete Development Hub",
    short_name: "Athlete Hub",
    description: "Private mobile training plans, daily workouts, and athlete development tracking.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07131d",
    theme_color: "#07131d",
    icons: [
      {
        src: "/icon",
        sizes: "128x128",
        type: "image/png"
      },
      {
        src: "/pwa-icons/icon-192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa-icons/icon-512",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/pwa-icons/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
