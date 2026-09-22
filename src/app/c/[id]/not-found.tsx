import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="condensed text-[0.7rem] text-toner-2">Not on file</p>
      <h1 className="display mt-2 text-2xl">This card does not exist or has expired</h1>
      <p className="mt-2 max-w-[68ch] text-toner-2">Cards issued without a database configured live only in memory and disappear when the server restarts. Ask the sender to run the check again.</p>
      <Link href="/check" className="mt-4 inline-block text-stamp">Run a new check</Link>
    </div>
  );
}
