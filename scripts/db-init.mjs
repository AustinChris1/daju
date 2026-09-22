// Creates the Daju tables in Supabase. Usage: node scripts/db-init.mjs (reads POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL from .env.local or the environment).
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

loadEnvLocal();
const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("No POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL found. Run `vercel env pull .env.local` first.");
  process.exit(1);
}
const sql = readFileSync("supabase/schema.sql", "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(sql);
const { rows } = await client.query("select table_name from information_schema.tables where table_schema='public' and table_name like 'tc_%' order by 1");
console.log("Tables ready:", rows.map((r) => r.table_name).join(", "));
await client.end();
