import { radarData } from "@/lib/radar";
import { fail, json } from "../_lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(await radarData(), 200, { "cache-control": "no-store" });
  } catch (err) {
    return fail(err, "Could not load the radar");
  }
}
