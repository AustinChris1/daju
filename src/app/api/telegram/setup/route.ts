import { tg } from "@/lib/telegram/api";
import { BRAND } from "@/lib/brand";

// One call registers everything with Telegram: webhook, command menu, descriptions, menu button.
// curl -X POST https://<site>/api/telegram/setup -H "Authorization: Bearer $TELEGRAM_WEBHOOK_SECRET"
const COMMANDS = [
  { command: "start", description: "What Daju does, with examples to try" },
  { command: "check", description: "Check a job message you paste after the command" },
  { command: "registry", description: "Search the four registers by name" },
  { command: "hotlines", description: "Who to call in your country" },
  { command: "help", description: "How to use the bot" },
];

async function run(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!secret) return Response.json({ error: "TELEGRAM_WEBHOOK_SECRET is not set" }, { status: 404 });
  if ((req.headers.get("authorization") ?? "") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 400 });

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!site.startsWith("https://")) return Response.json({ error: "NEXT_PUBLIC_SITE_URL must be an https URL" }, { status: 400 });

  const results = {
    webhook: await tg("setWebhook", { url: `${site}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }),
    commands: await tg("setMyCommands", { commands: COMMANDS }),
    description: await tg("setMyDescription", { description: `Forward a job ad, recruiter message or offer letter. ${BRAND.name} checks the sender against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana and hands you the reply to send. It never says "safe".` }),
    shortDescription: await tg("setMyShortDescription", { short_description: "Is this sender on file? Job-offer checks for NG, KE, UG, GH." }),
    menuButton: await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Open Daju", web_app: { url: `${site}/check` } } }),
    info: await tg("getWebhookInfo", {}),
  };
  const ok = Object.values(results).every((r) => r.ok);
  return Response.json({ ok, site, results }, { status: ok ? 200 : 502 });
}

export const POST = run;
export const GET = run;
