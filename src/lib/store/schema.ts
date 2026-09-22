// Mirror of supabase/schema.sql so the init route can run it without file-system access on Vercel.
export const SCHEMA_SQL = `
create table if not exists tc_checks (
  id text primary key,
  created_at timestamptz not null default now(),
  country text not null,
  kind text not null,
  level text not null,
  report jsonb not null
);
create index if not exists tc_checks_created on tc_checks (created_at desc);

create table if not exists tc_reports (
  id text primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  value text not null,
  country text,
  note text,
  check_id text
);
create index if not exists tc_reports_value on tc_reports (value);

create table if not exists tc_employers (
  id text primary key,
  created_at timestamptz not null default now(),
  company text not null,
  domain text not null,
  country text not null,
  contact_email text not null,
  method text,
  verified_at timestamptz,
  dns_token text not null,
  email_code text,
  manage_key text not null unique
);
create index if not exists tc_employers_domain on tc_employers (domain);

create table if not exists tc_offers (
  id text primary key,
  created_at timestamptz not null default now(),
  token text not null unique,
  employer_id text not null references tc_employers(id),
  role text not null,
  candidate text,
  country text not null,
  views integer not null default 0
);

create table if not exists tc_watches (
  id text primary key,
  created_at timestamptz not null default now(),
  email text not null,
  country text not null,
  entry_id text not null,
  entry_name text not null,
  status_at_watch text not null
);
create index if not exists tc_watches_email on tc_watches (email);

create or replace function tc_bump_offer_views(p_token text) returns void language sql as $$
  update tc_offers set views = views + 1 where token = p_token;
$$;
`;
