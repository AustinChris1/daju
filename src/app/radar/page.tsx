import type { Metadata } from "next";
import { radarData } from "@/lib/radar";
import { RadarLive } from "@/components/radar/RadarLive";

export const metadata: Metadata = { title: "Radar", description: "Live counts: checks, stamps, lures, reports and register movement across Nigeria, Kenya, Uganda and Ghana." };
export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const data = await radarData();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-bold text-stamp">Radar</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,4vw,2.8rem)]">What Daju is seeing right now</h1>
      <p className="mt-3 max-w-[62ch] text-toner-2">Every stamp, report and register change, counted live. No names, no message text: only the shape of what is being pasted and what came back.</p>
      <div className="mt-8">
        <RadarLive initial={data} />
      </div>
    </div>
  );
}
