import { ImageResponse } from "next/og";

import { renderPwaMonogramIcon } from "@/lib/pwa/branding";

export async function GET() {
  return new ImageResponse(renderPwaMonogramIcon({ monogram: "AH", size: 192 }), {
    width: 192,
    height: 192
  });
}
