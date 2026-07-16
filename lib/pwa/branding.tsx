import type { ReactElement } from "react";

export const pwaTheme = {
  background: "#07131d",
  surface: "#0d2232",
  highlight: "#1f5f8f",
  accent: "#d7a449",
  seam: "#c8d2df",
  text: "#f5f8fb"
} as const;

function BaseballSeam({
  rotate,
  size,
  top,
  left
}: {
  rotate: number;
  size: number;
  top: number;
  left: number;
}) {
  return (
    <div
      style={{
        border: `${Math.max(2, Math.round(size * 0.035))}px dashed rgba(200,210,223,0.58)`,
        borderColor: "rgba(200,210,223,0.62) transparent transparent transparent",
        borderRadius: size,
        height: size,
        left,
        opacity: 0.95,
        position: "absolute",
        top,
        transform: `rotate(${rotate}deg)`,
        width: size
      }}
    />
  );
}

export function renderPwaMonogramIcon(params: {
  monogram?: "AH" | "ADH";
  size: number;
  maskable?: boolean;
}): ReactElement {
  const { monogram = "AH", size, maskable = false } = params;
  const badgeSize = maskable ? Math.round(size * 0.62) : Math.round(size * 0.72);
  const borderSize = Math.max(8, Math.round(size * 0.028));
  const fontSize = monogram === "ADH" ? Math.round(size * 0.19) : Math.round(size * 0.24);
  const seamSize = Math.round(size * 0.74);

  return (
    <div
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 18% 16%, rgba(31,95,143,0.62), transparent 34%), linear-gradient(145deg, #07131d 0%, #0d2232 58%, #143552 100%)",
        color: pwaTheme.text,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%"
      }}
    >
      <div
        style={{
          background: "rgba(5, 15, 24, 0.18)",
          border: `${borderSize}px solid rgba(215,164,73,0.88)`,
          borderRadius: Math.round(badgeSize * 0.26),
          boxShadow: "0 20px 50px rgba(2, 10, 18, 0.28)",
          height: badgeSize,
          position: "absolute",
          transform: "rotate(45deg)",
          width: badgeSize
        }}
      />
      <BaseballSeam left={Math.round(size * -0.08)} rotate={25} size={seamSize} top={Math.round(size * 0.06)} />
      <BaseballSeam left={Math.round(size * 0.34)} rotate={205} size={seamSize} top={Math.round(size * 0.24)} />
      <div
        style={{
          alignItems: "center",
          color: pwaTheme.text,
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          fontSize,
          fontWeight: 800,
          letterSpacing: monogram === "ADH" ? Math.round(size * 0.015) : Math.round(size * 0.01),
          lineHeight: 1,
          position: "relative",
          textShadow: "0 10px 28px rgba(0,0,0,0.35)"
        }}
      >
        {monogram}
      </div>
      <div
        style={{
          background: "rgba(215,164,73,0.92)",
          borderRadius: 9999,
          bottom: Math.round(size * 0.12),
          height: Math.max(10, Math.round(size * 0.045)),
          position: "absolute",
          width: Math.max(10, Math.round(size * 0.045))
        }}
      />
    </div>
  );
}
