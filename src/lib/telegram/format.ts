import type { Report, VerdictLevel } from "@/lib/check/types";

const VERDICT_BANNER: Record<VerdictLevel, string> = {
  stop: "🛑 DAJU: STOP",
  caution: "⚠️ DAJU: CAUTION",
  on_file: "📋 DAJU: ON FILE",
  unknown: "❓ DAJU: NOT ON FILE",
};

/**
 * Derives a phone-friendly, plain-text response from an authoritative Daju Report.
 * Never reinterprets the report or produces stronger claims than the engine produced.
 *
 * ENGINE DECIDES. FORMATTER SELECTS AND SHORTENS. FORMATTER NEVER RE-JUDGES.
 */
export function formatCheckResult(report: Report, siteUrl: string): string {
  const banner = VERDICT_BANNER[report.verdict.level] ?? "📋 DAJU: RESULT";
  const headline = report.verdict.headline;

  // Authoritative verdict lines composed by the engine
  const verdictLines = (report.verdict.lines || []).filter(
    (l) => l && l.trim() !== headline.trim(),
  );

  // Authoritative findings from lure and clause rules
  const bullets: string[] = [];

  for (const f of report.lure || []) {
    if (bullets.length >= 4) break;
    // Avoid repeating headline title if no extra evidence exists
    if (f.title.trim() === headline.trim() && !f.evidence) continue;
    const ev = f.evidence ? `: ${f.evidence}` : "";
    bullets.push(`${f.title}${ev}`);
  }

  for (const c of report.clauses || []) {
    if (bullets.length >= 4) break;
    const cit = c.citation ? ` (${c.citation.act} ${c.citation.section})` : "";
    const ev = c.evidence ? `: ${c.evidence}` : "";
    bullets.push(`${c.label}${cit}${ev}`);
  }

  const parts: string[] = [banner, "", headline];

  if (verdictLines.length > 0) {
    parts.push("", ...verdictLines);
  }

  if (bullets.length > 0) {
    parts.push("", "Evidence:", ...bullets.map((b) => `• ${b}`));
  }

  const reply = report.actions?.replies?.en;
  if (reply) {
    parts.push("", "Reply you can send:", reply);
  }

  parts.push(
    "",
    "View full evidence card:",
    `${siteUrl.replace(/\/+$/, "")}/c/${report.id}`,
    "",
    'Daju never says an offer is "safe".',
  );

  return parts.join("\n");
}

export function formatStartMessage(): string {
  return [
    "Forward me a job message, recruiter message or offer text.",
    "",
    "I'll check the claimed sender against recruitment-agency records for Nigeria, Kenya, Uganda and Ghana, compare contact details where available, and show you the evidence.",
    "",
    "I never tell you an offer is 'safe'.",
  ].join("\n");
}

export function formatHelpMessage(): string {
  return [
    "How to use Daju on Telegram:",
    "",
    "• Forward a recruiter or job message here",
    "• Or paste the message or offer letter text",
    "• Daju checks licensed-agency registers for Nigeria, Kenya, Uganda and Ghana",
    "• Screenshots and document uploads are not supported yet (paste the text)",
    "• Every check gives you a full evidence card with official citations",
    "",
    "Type or forward any message to check it.",
  ].join("\n");
}

export function formatUnsupportedMediaMessage(): string {
  return "Screenshot and document checking is coming next. For now, forward or paste the message text here and I'll check it.";
}

export function formatEmptyMessage(): string {
  return "Please paste or forward a job message, recruiter outreach, or offer letter text to check.";
}

export function formatErrorMessage(): string {
  return "Daju couldn't complete this check right now. Please try again, or use the web checker.";
}


