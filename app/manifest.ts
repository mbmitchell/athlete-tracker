import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Athlete Development Hub",
    short_name: "Athlete Hub",
    description: "Mobile-first athlete development planning, execution, and monitoring.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f9fc",
    theme_color: "#0f4c81",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
