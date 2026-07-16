import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0f4c81 0%, #38bdf8 100%)",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "18px solid rgba(255,255,255,0.22)",
            borderRadius: 72,
            color: "white",
            display: "flex",
            fontSize: 196,
            fontWeight: 700,
            height: 340,
            justifyContent: "center",
            width: 340
          }}
        >
          AD
        </div>
      </div>
    ),
    size
  );
}
