import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="prose-daju mx-auto max-w-[72ch] px-4 py-10 sm:px-6">
      <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Terms of use</h1>
      <p className="text-toner-2">Last updated 22 September 2026.</p>

      <h2>What {BRAND.name} is</h2>
      <p>{BRAND.name} compares the text you paste with public registers of licensed employment agencies, published official warnings and labour statutes, and shows you what it found, with dates and sources. It is an information tool.</p>

      <h2>What it is not</h2>
      <p>It is not legal advice, not a guarantee that any offer, agency or employer is genuine, and not a substitute for contacting the register or the authority yourself. A card never says an offer is safe, and no card should be read that way. A &ldquo;Not on file&rdquo; result is not an accusation: most direct employers are not agencies and do not appear in agency registers.</p>

      <h2>Your responsibilities</h2>
      <p>Paste only messages you are entitled to share. Do not paste other people&apos;s private information beyond what is needed to check an offer. Report a contact only when you have a genuine reason to believe it was used to defraud someone. Do not use the service to harass any person or business.</p>

      <h2>Employers</h2>
      <p>By verifying a domain you confirm you are authorised to act for that organisation. A verified sender badge states that control of a domain was proved on a date, nothing more. We may remove verification for a domain used to send fraudulent offers.</p>

      <h2>Data sources</h2>
      <p>Register data is reproduced from public government sources as dated snapshots and may lag the live register. Statute citations were checked against official texts on the date shown on the method page; laws change.</p>

      <h2>Availability and liability</h2>
      <p>The service is provided as is, without warranty. To the extent permitted by law, the maintainers are not liable for decisions made in reliance on a card. If you would have lost money, the person to call is on the hotlines page, not us.</p>

      <h2>Changes</h2>
      <p>These terms may change; the date at the top is the version in force.</p>
    </div>
  );
}
