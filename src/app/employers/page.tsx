import type { Metadata } from "next";
import { EmployerConsole } from "@/components/employers/EmployerConsole";

export const metadata: Metadata = { title: "Employers: verified sender" };

export default function EmployersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="display text-[clamp(1.6rem,4vw,2.4rem)]">Issue offers nobody can borrow</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">
        Prove you control your company domain with one DNS record. From then on, every offer link you issue shows the candidate a verified sender the moment they paste it into a check, and a message that uses your name with a different number is flagged as an impersonation.
      </p>
      <div className="mt-8">
        <EmployerConsole siteUrl={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"} />
      </div>
    </div>
  );
}
