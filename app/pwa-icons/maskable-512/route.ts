import { ImageResponse } from "next/og";

import { renderPwaMonogramIcon } from "@/lib/pwa/branding";

export async function GET() {
  return new ImageResponse(renderPwaMonogramIcon({ monogram: "AH", size: 512, maskable: true }), {
    width: 512,
    height: 512
  });
}
