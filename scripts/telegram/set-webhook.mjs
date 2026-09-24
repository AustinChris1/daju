// Scripts to register, inspect or delete the Telegram webhook for Daju.
// Usage:
//   node scripts/telegram/set-webhook.mjs set https://<app-domain>/api/telegram/webhook
//   node scripts/telegram/set-webhook.mjs info
//   node scripts/telegram/set-webhook.mjs delete

import { readFileSync, existsSync } from "node:fs";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("Error: Missing TELEGRAM_BOT_TOKEN in environment or .env.local.");
  process.exit(1);
}

const command = process.argv[2]?.toLowerCase();
const API = `https://api.telegram.org/bot${token}`;

async function main() {
  if (command === "set") {
    const webhookUrl = process.argv[3]?.trim();
    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      console.error("Error: Please provide a valid HTTPS URL.");
      console.error("Example: node scripts/telegram/set-webhook.mjs set https://daju-bice.vercel.app/api/telegram/webhook");
      process.exit(1);
    }

    const payload = {
      url: webhookUrl,
      allowed_updates: ["message"],
    };

    if (secret) {
      payload.secret_token = secret;
      console.log("Setting webhook with secret_token verification enabled...");
    } else {
      console.log("Setting webhook without secret_token (TELEGRAM_WEBHOOK_SECRET not set)...");
    }

    const res = await fetch(`${API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Response:", data);
  } else if (command === "info") {
    const res = await fetch(`${API}/getWebhookInfo`);
    const data = await res.json();
    console.log("Webhook Info:", data);
  } else if (command === "delete") {
    const res = await fetch(`${API}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: false }),
    });
    const data = await res.json();
    console.log("Webhook deleted:", data);
  } else {
    console.log("Usage:");
    console.log("  node scripts/telegram/set-webhook.mjs set <https://your-domain/api/telegram/webhook>");
    console.log("  node scripts/telegram/set-webhook.mjs info");
    console.log("  node scripts/telegram/set-webhook.mjs delete");
  }
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});

