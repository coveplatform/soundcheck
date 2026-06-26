import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { genrePages } from "@/lib/genre-pages";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const metadata: Metadata = {
  title: "Music Feedback by Genre — Honest Reviews for Every Style | MixReflect",
  description:
    "Get an honest, genre-aware read on your track. Pick your genre for feedback tuned to how your style is actually judged: hip-hop, electronic, pop, rock and 28 more.",
  alternates: { canonical: `${SITE_URL}/feedback` },
};

export default function FeedbackHubPage() {
  const genres = [...genrePages].sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Music Feedback by Genre",
        url: `${SITE_URL}/feedback`,
        description:
          "Honest, genre-aware feedback on your track across every major style.",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: genres.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/feedback/${g.slug}`,
            name: `${g.name} Feedback`,
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
            name: "Music Feedback",
            item: `${SITE_URL}/feedback`,
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
            <Link href="/alternatives" className="hidden sm:inline text-white/55 hover:text-white transition-colors">
              compare
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
            [ feedback by genre ]
          </p>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em]">
            honest feedback,
            <br />
            <span style={{ color: ACCENT }}>tuned to your style</span>.
          </h1>
          <p className="text-white/55 text-lg mt-5 max-w-xl normal-case">
            Every genre is judged differently. Pick yours for a read that knows
            what actually matters in your style — then drop a track and get a
            score, a verdict, and reactions from real listeners.
          </p>
        </div>
      </div>

      {/* grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
          {genres.map((g) => (
            <Link
              key={g.slug}
              href={`/feedback/${g.slug}`}
              className="group flex items-center justify-between gap-2 bg-[#0a0a0a] px-5 py-5 hover:bg-[#0e0e0e] transition-colors"
            >
              <span className="text-base sm:text-lg font-extrabold tracking-tight leading-tight group-hover:text-[#6ee7ff] transition-colors">
                {g.name}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/25 group-hover:text-[#6ee7ff] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
        <p className={`${mono.className} text-[12px] text-white/35 mt-5 normal-case`}>
          Don&apos;t see your genre? Any track works — drop it on the{" "}
          <Link href="/" className="text-white/60 hover:text-white underline underline-offset-2">
            home page
          </Link>{" "}
          for a general read.
        </p>
      </div>

      {/* cta */}
      <div className="relative z-10 border-t border-white/10 bg-[#6ee7ff] text-black">
        <div className="max-w-5xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            find out what&apos;s actually
            <br />
            working in your track.
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
