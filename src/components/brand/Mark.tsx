import { BRAND } from "@/lib/brand";

interface Props {
  size?: number;
  className?: string;
  title?: string;
  ink?: string;
}

// The tone seal: the two acute (high-tone) marks of dájú inside a double-ring stamp.
export function Mark({ size = 28, className, title = BRAND.name, ink = "var(--stamp)" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={title} className={className} fill="none">
      <circle cx="16" cy="16" r="13.5" stroke={ink} strokeWidth="2.4" />
      <circle cx="16" cy="16" r="9.8" stroke={ink} strokeWidth="1.1" opacity="0.7" />
      <path d="M10.5 20.5 14 11.5M18 20.5 21.5 11.5" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className = "", size = 26 }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark size={size} className="shrink-0" />
      <span className="wordmark text-toner" style={{ fontSize: size * 0.86 }}>
        {BRAND.display}
      </span>
    </span>
  );
}
