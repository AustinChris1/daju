import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

// Two optional providers. Claude via the Anthropic SDK, or any OpenAI-compatible endpoint (Groq by default) via fetch.
// The rule engine never depends on either; without a key the check runs on heuristics alone.
const ANTHROPIC_MODEL = process.env.TRUECOPY_MODEL || "claude-opus-5";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const GROQ_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

type Provider = "anthropic" | "groq" | null;

function provider(): Provider {
  const pick = (process.env.LLM_PROVIDER || "").toLowerCase();
  if (pick === "groq" && process.env.GROQ_API_KEY) return "groq";
  if (pick === "anthropic" && (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return "anthropic";
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  return null;
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  return client;
}

export function llmAvailable(): boolean {
  return provider() !== null;
}

export function llmLabel(): string {
  const p = provider();
  return p === "anthropic" ? `claude:${ANTHROPIC_MODEL}` : p === "groq" ? `groq:${GROQ_MODEL}` : "none";
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

const JSON_SHAPE = `Respond with a single JSON object with exactly these keys: organisation (string|null), recruiter_name (string|null), is_offer_letter (boolean), job_title (string|null), destination_country (string|null), fee_requested ({amount:number|null, currency:string|null, purpose:string|null}|null), salary ({amount:number|null, currency:string|null, period:string|null}|null), one_line_summary (string).`;

async function groqChat(system: string, user: string, json: boolean, maxTokens: number): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(`${GROQ_URL}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("groq failed", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return j.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.warn("groq failed", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function refineWithClaude(text: string): Promise<Refined | null> {
  const p = provider();
  if (!p) return null;
  const input = text.slice(0, 12000);
  if (p === "groq") {
    const raw = await groqChat(`${SYSTEM}\n${JSON_SHAPE}`, input, true, 1200);
    if (!raw) return null;
    try {
      const parsed = Refine.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
  try {
    const res = await anthropic().messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low", format: zodOutputFormat(Refine) },
      messages: [{ role: "user", content: input }],
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
  const p = provider();
  if (!p) return null;
  const key = lang + "::" + text;
  const hit = translationCache.get(key);
  if (hit) return hit;
  const name = LANG_NAMES[lang];
  if (!name) return null;
  const system = `Translate the user's message into natural, polite ${name} as a job seeker would write it on WhatsApp. Keep organisation names, registry names (NELEX, NEA, EEMIS, Labour Department) and numbers unchanged. Output only the translation.`;
  let out: string | null = null;
  if (p === "groq") {
    out = await groqChat(system, text, false, 800);
  } else {
    try {
      const res = await anthropic().messages.create({ model: ANTHROPIC_MODEL, max_tokens: 800, output_config: { effort: "low" }, system, messages: [{ role: "user", content: text }] });
      const block = res.content.find((b) => b.type === "text");
      out = block && block.type === "text" ? block.text.trim() : null;
    } catch (err) {
      console.warn("translate failed", err instanceof Anthropic.APIError ? err.status : err);
    }
  }
  if (out) translationCache.set(key, out);
  return out;
}
