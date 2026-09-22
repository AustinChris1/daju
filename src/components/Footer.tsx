import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Footer({ asOf }: { asOf: { country: string; date: string }[] }) {
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-toner-2">
        <p className="font-mono text-xs">
          Register snapshots: {asOf.map((a) => `${a.country} ${a.date}`).join(" · ")}
        </p>
        <p className="mt-3 max-w-[68ch]">
          {BRAND.name} shows what public registers and published warnings say, as of the dates above. It never says an offer is safe, and it is not legal advice. When in doubt, call the number on the register, not the number in the message.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/method" className="text-toner-2 hover:text-toner">How the check works</Link>
          <Link href="/hotlines" className="text-toner-2 hover:text-toner">Hotlines</Link>
          <a href="/api/stats" className="text-toner-2 hover:text-toner">API</a>
          <Link href="/brand" className="text-toner-2 hover:text-toner">Brand</Link>
        </p>
      </div>
    </footer>
  );
}
