import { Reveal } from "./Reveal";

const QA: { q: string; a: string }[] = [
  {
    q: "Why not just ask ChatGPT or Grok about my offer?",
    a: "Do, for the reading. A model spots a training bond and drafts a reply, and sometimes invents a section of the Labour Act or calls a real agency fake. It does not hold the four registers pinned to a date. Daju answers one thing a model cannot: this name is on this government list as of this date, and this phone or email is, or is not, the one they published.",
  },
  {
    q: "Most companies that email me are not agencies. What does Daju say then?",
    a: "Not on file, and why that is normal: direct employers do not appear in agency registers. The card then shows what it could verify instead: how long the domain has existed, whether the website is live and names the company, and, for Nigeria, whether the company is on the CAC register when that lookup is connected.",
  },
  {
    q: "Does Daju ever say an offer is safe?",
    a: "No. It says what the registers, the domain records and the official warnings say, each with its source and date. A licensed agency with the right number can still send a bad contract, which is why the offer-letter clauses are checked against the labour law.",
  },
  {
    q: "Where does the data come from, and how fresh is it?",
    a: "NELEX (Nigeria), the NEA register (Kenya), EEMIS (Uganda) and GLMIS (Ghana), re-read every Monday with the difference committed and shown on the Registers page. Hotlines and law citations link to the official page they were taken from.",
  },
  {
    q: "What happens to the message I paste?",
    a: "It is read by the rule engine and stored with its card so the link works when you share it to a group. Nothing is shown publicly unless you share that link. Screenshots are read on your own phone and never uploaded.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6" aria-labelledby="faq">
      <Reveal>
        <h2 id="faq" className="display text-[clamp(1.6rem,3.5vw,2.4rem)]">
          Straight <span className="sweep" data-fx="sweep">answers</span>
        </h2>
      </Reveal>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {QA.map((item, i) => (
          <Reveal key={item.q} delay={i * 60}>
            <details className="faq card group p-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-bold text-toner">
                {item.q}
                <span className="faq-mark mt-0.5 shrink-0 text-stamp" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-toner-2">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
