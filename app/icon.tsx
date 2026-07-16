import { ImageResponse } from "next/og";

import { renderPwaMonogramIcon } from "@/lib/pwa/branding";

export const size = {
  width: 128,
  height: 128
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(renderPwaMonogramIcon({ monogram: "AH", size: 128 }), size);
}
