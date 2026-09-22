import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="prose-daju mx-auto max-w-[72ch] px-4 py-10 sm:px-6">
      <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Privacy</h1>
      <p className="text-toner-2">Last updated 22 September 2026.</p>

      <h2>What we store when you run a check</h2>
      <p>The text you paste, the result card, the country, and the time. The card has a random id and is reachable only by that link. We store the text so the card can be reopened and shared; we do not read it for any other purpose. Do not paste anything you are not willing to share by link.</p>

      <h2>What we do not collect</h2>
      <p>No account, no name, no email is required to run a check. We do not use advertising trackers or analytics cookies. The site keeps a short list of your recent checks and your theme choice in your own browser&apos;s storage; that list never leaves your device.</p>

      <h2>Reports</h2>
      <p>When you report a phone number, email, domain or name, we store the value, the country and your note. We do not store who reported it. Values are shown to other users in masked form and as counts.</p>

      <h2>Employers</h2>
      <p>Employers give a company name, a domain, a country and a contact email on that domain. The email is used only to check that it belongs to the domain; we do not send mail to it. Verification is by a DNS record you publish yourself. Offer links record how many times they were opened, not by whom.</p>

      <h2>Optional language model</h2>
      <p>If the operator has configured a model provider (Claude or Groq), the pasted text is sent to that provider to refine extraction and to translate the reply. Providers process it under their own terms and do not train on it under the API terms in force at the time of writing. If no provider is configured, nothing leaves our servers.</p>

      <h2>Register data</h2>
      <p>The agencies listed on this site come from public government registers, reproduced as dated snapshots. Contact details shown for an agency are the ones the register publishes. If you are an agency and your record is wrong, the correction belongs with the register; we refresh from it.</p>

      <h2>Retention and deletion</h2>
      <p>Cards and reports are kept so that shared links keep working. To have a card or report removed, contact the maintainers through the repository with the card id. We remove it within seven days.</p>

      <h2>Contact</h2>
      <p>Questions about this policy: open an issue on the {BRAND.name} GitHub repository linked in the footer.</p>
    </div>
  );
}
