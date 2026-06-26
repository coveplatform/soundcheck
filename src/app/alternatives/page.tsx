import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { alternativePages } from "@/lib/alternatives";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const metadata: Metadata = {
  title: "MixReflect vs the Alternatives — Honest Comparisons | MixReflect",
  description:
    "How does MixReflect compare to SubmitHub, Groover, LANDR, SoundBetter and more? Honest, side-by-side breakdowns of what each tool is for and when MixReflect is the better call.",
  alternates: { canonical: `${SITE_URL}/alternatives` },
};

export default function AlternativesHubPage() {
  const pages = [...alternativePages].sort((a, b) =>
    a.competitor.localeCompare(b.competitor)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "MixReflect vs the Alternatives",
        url: `${SITE_URL}/alternatives`,
        description:
          "Honest, side-by-side comparisons of MixReflect against the tools artists use to get feedback, mastering, promotion and distribution.",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: pages.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/alternatives/${p.slug}`,
            name: `MixReflect vs ${p.competitor}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Alternatives",
            item: `${SITE_URL}/alternatives`,
          },
        ],
      },
    ],
  };

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className={`${mono.className} flex items-center gap-4 sm:gap-5 text-[13px]`}>
            <Link href="/blog" className="hidden sm:inline text-white/55 hover:text-white transition-colors">
              the drop
            </Link>
            <Link href="/feedback" className="hidden sm:inline text-white/55 hover:text-white transition-colors">
              by genre
            </Link>
            <Link
              href="/#pricing"
              className="bg-[#6ee7ff] text-black px-3.5 py-1.5 font-bold transition-colors hover:bg-white"
            >
              get feedback
            </Link>
          </div>
        </div>
      </header>

      {/* masthead */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>
            [ compare ]
          </p>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em]">
            how mixreflect
            <br />
            <span style={{ color: ACCENT }}>stacks up</span>.
          </h1>
          <p className="text-white/55 text-lg mt-5 max-w-xl normal-case">
            Most tools master, promote, or distribute your music. MixReflect
            tells you if it&apos;s actually ready first. Here&apos;s an honest
            look at how it compares to the alternatives, and when each one is the
            right call.
          </p>
        </div>
      </div>

      {/* grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/alternatives/${p.slug}`}
              className="group flex flex-col bg-[#0a0a0a] p-6 hover:bg-[#0e0e0e] transition-colors"
            >
              <div className={`${mono.className} text-[11px] text-white/40 mb-2.5`}>
                mixreflect vs
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight group-hover:text-[#6ee7ff] transition-colors mb-3">
                {p.competitor}
              </h2>
              <p className="text-white/50 text-[14px] leading-relaxed normal-case line-clamp-3 flex-1">
                {p.competitorWhat}
              </p>
              <span className={`${mono.className} mt-4 inline-flex items-center gap-1 text-[12px] text-white/35 group-hover:text-white transition-colors`}>
                compare
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* cta */}
      <div className="relative z-10 border-t border-white/10 bg-[#6ee7ff] text-black">
        <div className="max-w-5xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            skip the guesswork.
            <br />
            get an honest read first.
          </h2>
          <Link
            href="/"
            className="group shrink-0 inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold px-8 py-4 text-sm hover:bg-[#141414] transition-colors"
          >
            get feedback
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
