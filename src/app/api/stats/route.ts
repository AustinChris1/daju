import { ENGINE_VERSION } from "@/lib/check/engine";
import { llmAvailable } from "@/lib/extract/llm";
import { registryStats } from "@/lib/registry/load";
import { getStore } from "@/lib/store";
import { fail, json } from "../_lib/http";

export async function GET() {
  try {
    const store = getStore();
    const stats = await store.stats();
    return json({ ...stats, registries: registryStats(), engineVersion: ENGINE_VERSION, llm: llmAvailable(), driver: store.driver });
  } catch (err) {
    return fail(err, "Could not load stats");
  }
}
