import { ImageResponse } from "next/og";
import { getStore } from "@/lib/store";
import { VERDICT_LABEL } from "@/lib/check/verdict";
import { BRAND } from "@/lib/brand";

export const alt = "Daju check";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK: Record<string, string> = { stop: "#b3261e", caution: "#8a5a00", on_file: "#5e35a1", unknown: "#55534e" };

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getStore().getCheck(id);
  const level = row?.report.verdict.level ?? "unknown";
  const headline = row?.report.verdict.headline ?? "This card has expired";
  const line = row?.report.verdict.lines[0] ?? "Run a new check.";
  const ink = INK[level];
  const kicker = `${BRAND.name} check${row ? ` · ${row.report.country}` : ""}`;
  const registers = row ? `Registers: ${Object.entries(row.report.registryAsOf).map(([c, d]) => `${c} ${d}`).join("  ")}` : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f6f2", color: "#121212", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#55534e", fontWeight: 800 }}>{kicker}</div>
          <div style={{ display: "flex", border: `4px solid ${ink}`, borderRadius: 12, padding: 4, transform: "rotate(-6deg)" }}>
            <div style={{ display: "flex", border: `2px solid ${ink}`, color: ink, borderRadius: 8, padding: "12px 26px", fontSize: 54, fontWeight: 800, textTransform: "uppercase", letterSpacing: 4 }}>{VERDICT_LABEL[level]}</div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 60, fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1000 }}>{headline}</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#55534e", lineHeight: 1.35, maxWidth: 1000 }}>{line}</div>
        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", fontSize: 22, color: "#55534e" }}>
          <div style={{ display: "flex" }}>{BRAND.tagline}</div>
          <div style={{ display: "flex" }}>{registers}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
