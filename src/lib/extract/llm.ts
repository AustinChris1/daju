import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const MODEL = process.env.TRUECOPY_MODEL || "claude-opus-5";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  if (!client) client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  return client;
}

export function llmAvailable(): boolean {
  return getClient() !== null;
}

const Refine = z.object({
  organisation: z.string().nullable(),
  recruiter_name: z.string().nullable(),
  is_offer_letter: z.boolean(),
  job_title: z.string().nullable(),
  destination_country: z.string().nullable(),
  fee_requested: z.object({ amount: z.number().nullable(), currency: z.string().nullable(), purpose: z.string().nullable() }).nullable(),
  salary: z.object({ amount: z.number().nullable(), currency: z.string().nullable(), period: z.string().nullable() }).nullable(),
  one_line_summary: z.string(),
});

export type Refined = z.infer<typeof Refine>;

const SYSTEM = `You extract facts from job adverts, recruiter messages and offer letters sent to job seekers in Nigeria, Kenya, Uganda and Ghana. Extract only what the text states. Never judge whether it is a scam; a separate rule engine does that. organisation is the employer or agency name exactly as written, or null. fee_requested is any money the job seeker is asked to pay, with its stated purpose, or null. salary is what the job pays, or null. one_line_summary is one neutral sentence describing the offer.`;

export async function refineWithClaude(text: string): Promise<Refined | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.messages.parse({
      model: MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: zodOutputFormat(Refine) },
      messages: [{ role: "user", content: text.slice(0, 12000) }],
    });
    return res.parsed_output ?? null;
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.warn("claude refine failed", err.status, err.message);
    else console.warn("claude refine failed", err);
    return null;
  }
}

const LANG_NAMES: Record<string, string> = { ig: "Igbo", yo: "Yoruba", ha: "Hausa", sw: "Kiswahili", lg: "Luganda", tw: "Akan Twi", pcm: "Nigerian Pidgin", en: "English" };

const translationCache = new Map<string, string>();

export async function translateReply(text: string, lang: string): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const key = lang + "::" + text;
  const hit = translationCache.get(key);
  if (hit) return hit;
  const name = LANG_NAMES[lang];
  if (!name) return null;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 800,
      output_config: { effort: "low" },
      system: `Translate the user's message into natural, polite ${name} as a job seeker would write it on WhatsApp. Keep organisation names, registry names (NELEX, NEA, EEMIS, Labour Department) and numbers unchanged. Output only the translation.`,
      messages: [{ role: "user", content: text }],
    });
    const out = res.content.find((b) => b.type === "text");
    const t = out && out.type === "text" ? out.text.trim() : null;
    if (t) translationCache.set(key, t);
    return t;
  } catch (err) {
    console.warn("translate failed", err instanceof Anthropic.APIError ? err.status : err);
    return null;
  }
}
