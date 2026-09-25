import type { Country } from "@/lib/countries";

// Round flag marks drawn as SVG, so they render the same on every platform. Windows shows emoji flags as letters.
const ART: Record<Country, (id: string) => React.ReactNode> = {
  NG: () => (
    <>
      <rect width="24" height="24" fill="#008751" />
      <rect x="8" width="8" height="24" fill="#fff" />
    </>
  ),
  GH: () => (
    <>
      <rect width="24" height="24" fill="#006B3F" />
      <rect width="24" height="16" fill="#FCD116" />
      <rect width="24" height="8" fill="#CE1126" />
      <path d="M12 8.6l1.05 3.1h3.25l-2.63 1.9 1 3.1L12 14.8l-2.67 1.9 1-3.1-2.63-1.9h3.25z" fill="#000" />
    </>
  ),
  KE: () => (
    <>
      <rect width="24" height="24" fill="#006600" />
      <rect width="24" height="15.5" fill="#BB0000" />
      <rect width="24" height="8" fill="#000" />
      <rect y="7.4" width="24" height="1.2" fill="#fff" />
      <rect y="15.4" width="24" height="1.2" fill="#fff" />
      <path d="M8.9 4.2l6.2 15.6M15.1 4.2L8.9 19.8" stroke="#fff" strokeWidth="0.9" />
      <ellipse cx="12" cy="12" rx="3.4" ry="7" fill="#BB0000" stroke="#fff" strokeWidth="0.9" />
      <ellipse cx="12" cy="12" rx="0.9" ry="4.2" fill="#000" />
    </>
  ),
  UG: () => (
    <>
      <rect width="24" height="24" fill="#D90000" />
      <rect width="24" height="20" fill="#FCDC04" />
      <rect width="24" height="16" fill="#000" />
      <rect width="24" height="12" fill="#D90000" />
      <rect width="24" height="8" fill="#FCDC04" />
      <rect width="24" height="4" fill="#000" />
      <circle cx="12" cy="12" r="4.2" fill="#fff" />
      <path d="M11.2 15.2c0-2.3.5-3.9 1.9-4.8l1.1-.8-.7 1.5c-.5 1.1-.8 2.4-.8 4.1z" fill="#8a8a8a" />
      <circle cx="13.6" cy="9.4" r="0.55" fill="#D90000" />
    </>
  ),
};

export function Flag({ code, size = 16, className = "" }: { code: Country; size?: number; className?: string }) {
  const id = `flag-${code}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={code} className={`inline-block shrink-0 align-[-0.15em] ${className}`}>
      <clipPath id={id}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${id})`}>{ART[code](id)}</g>
      <circle cx="12" cy="12" r="11.5" fill="none" stroke="rgba(0,0,0,0.12)" />
    </svg>
  );
}
