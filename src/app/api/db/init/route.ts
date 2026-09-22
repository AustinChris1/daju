import pg from "pg";
import { SCHEMA_SQL } from "@/lib/store/schema";

// One-time table creation, run where the database URL exists. Requires DB_INIT_TOKEN to be set and sent as a bearer token.

// Supabase's direct host is IPv6-only, which Vercel functions cannot reach; the pooled URL comes first.
function candidateUrls(): string[] {
  const e = process.env;
  return [e.POSTGRES_URL, e.POSTGRES_PRISMA_URL, e.POSTGRES_URL_NON_POOLING, e.DATABASE_URL].filter((u): u is string => !!u);
}

// pg treats sslmode in the URL as verify-full, which Supabase's chain fails; drive SSL from the option object instead.
function stripSslParams(url: string): string {
  try {
    const u = new URL(url);
    for (const k of ["sslmode", "uselibpqcompat", "sslcert", "sslrootcert"]) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

async function runSchema(url: string): Promise<string[]> {
  const client = new pg.Client({ connectionString: stripSslParams(url), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query(SCHEMA_SQL);
    const { rows } = await client.query("select table_name from information_schema.tables where table_schema='public' and table_name like 'tc_%' order by 1");
    return rows.map((r: { table_name: string }) => r.table_name);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function POST(req: Request) {
  const token = process.env.DB_INIT_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const urls = candidateUrls();
  if (!urls.length) return Response.json({ error: "No Postgres URL in the environment" }, { status: 500 });
  const errors: string[] = [];
  for (const url of urls) {
    try {
      const tables = await runSchema(url);
      return Response.json({ ok: true, tables, via: new URL(url).hostname });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${safeHost(url)}: ${msg}`);
      console.error("db init failed", safeHost(url), msg);
    }
  }
  return Response.json({ error: "Init failed", attempts: errors }, { status: 500 });
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown host";
  }
}
