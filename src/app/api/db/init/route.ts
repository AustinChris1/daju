import pg from "pg";
import { SCHEMA_SQL } from "@/lib/store/schema";

// One-time table creation, run where the database URL exists. Requires DB_INIT_TOKEN to be set and sent as a bearer token.
export async function POST(req: Request) {
  const token = process.env.DB_INIT_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "No Postgres URL in the environment" }, { status: 500 });
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(SCHEMA_SQL);
    const { rows } = await client.query("select table_name from information_schema.tables where table_schema='public' and table_name like 'tc_%' order by 1");
    return Response.json({ ok: true, tables: rows.map((r: { table_name: string }) => r.table_name) });
  } catch (err) {
    console.error("db init failed", err);
    return Response.json({ error: "Init failed; see server logs" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
