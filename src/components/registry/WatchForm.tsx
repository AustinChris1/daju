"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function WatchForm({ country, entryId }: { country: string; entryId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "already" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/watch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, country, entryId }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setState(j.already ? "already" : "done");
    } catch {
      setState("error");
    }
  }

  if (state === "done" || state === "already") {
    return <p className="mt-3 text-sm text-green">{state === "already" ? "You already watch this entry." : "Watching. You will hear from us only when the register changes."}</p>;
  }
  return (
    <form onSubmit={submit} className="mt-3 flex max-w-md gap-2">
      <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" />
      <Button type="submit" variant="secondary" disabled={state === "busy"}>
        {state === "busy" ? "Saving" : "Watch"}
      </Button>
      {state === "error" && <span className="self-center text-sm text-red">Could not save. Try again.</span>}
    </form>
  );
}
