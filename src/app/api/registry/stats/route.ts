import { registryNotes, registryStats } from "@/lib/registry/load";
import { fail, json } from "../../_lib/http";

export async function GET() {
  try {
    return json({ registries: registryStats(), notes: registryNotes() });
  } catch (err) {
    return fail(err, "Could not load registry stats");
  }
}
