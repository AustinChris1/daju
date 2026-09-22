import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function SectionLabel({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <h2 className="condensed flex items-baseline gap-2 text-[0.8rem] text-toner-2">
      {n !== undefined && <span className="font-mono text-toner">{n}.</span>}
      {children}
    </h2>
  );
}

const base = "inline-flex items-center justify-center gap-2 rounded-xs px-4 py-2.5 text-sm font-bold tab transition-colors disabled:cursor-not-allowed";

export function Button({ variant = "primary", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const v =
    variant === "primary"
      ? "bg-stamp text-paper hover:bg-stamp-hover disabled:bg-transparent disabled:text-toner-2 disabled:outline-dotted disabled:outline-1 disabled:outline-toner-2"
      : variant === "secondary"
        ? "border border-toner text-toner hover:bg-paper-2 disabled:border-dotted disabled:text-toner-2"
        : "text-toner-2 hover:text-toner";
  return <button className={`${base} ${v} ${className}`} {...rest} />;
}

const field = "w-full rounded-xs border border-rule bg-paper-2 px-3 py-2.5 text-[0.95rem] text-toner placeholder:text-toner-2 focus:border-stamp";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${field} font-mono leading-relaxed ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${field} ${props.className ?? ""}`} />;
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-toner">
      {children}
      {hint && <span className="ml-2 font-normal text-toner-2">{hint}</span>}
    </label>
  );
}

export function OfficialBox({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="border border-rule bg-paper-2 p-3 font-mono text-xs text-toner-2">
      <div className="condensed mb-2 text-[0.65rem] text-toner-2">For official use</div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-toner-2">{k}</dt>
            <dd className="break-all text-toner">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`sheet p-5 sm:p-7 ${className}`}>{children}</div>;
}
