import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ArrowRight, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { getAlternativePage, alternativePages } from "@/lib/alternatives";
import { SITE_URL } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function generateStaticParams() {
  return alternativePages.map((p) => ({ competitor: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const { competitor } = await params;
  const page = getAlternativePage(competitor);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `${SITE_URL}/alternatives/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${SITE_URL}/alternatives/${page.slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MixReflect" }],
    },
  };
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const { competitor } = await params;
  const page = getAlternativePage(competitor);
  if (!page) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Alternatives", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.competitor} Alternative`,
        item: `${SITE_URL}/alternatives/${page.slug}`,
      },
    ],
  };

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <AuthButtons theme="dark" />
        </div>
      </header>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-5 pt-6">
        <ol className={`${mono.className} flex items-center gap-2 text-[12px] text-white/35`}>
          <li>
            <Link href="/" className="hover:text-white transition-colors">
              home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-white/60">{page.competitor} alternative</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pt-12 pb-16">
        <p className={`${mono.className} text-[13px] text-white/55 mb-4`}>
          [ {page.competitor.toLowerCase()} alternative ]
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.02] max-w-3xl">
          {page.h1}
        </h1>
      </section>

      {/* Verdict / TL;DR */}
      <section className="max-w-6xl mx-auto px-5 pb-16">
        <div className="border border-white/10 border-l-2 bg-[#0e0e0e] p-7 max-w-3xl" style={{ borderLeftColor: ACCENT }}>
          <p className={`${mono.className} text-[12px] text-white/40 mb-3`}>[ the short version ]</p>
          <p className="text-white/75 leading-relaxed text-lg normal-case">{page.verdict}</p>
        </div>
      </section>

      {/* What the competitor is */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5">
            what {page.competitor.toLowerCase()} is — and what it&apos;s good at
          </h2>
          <div className="max-w-3xl space-y-4">
            <p className="text-white/60 leading-relaxed normal-case">{page.competitorWhat}</p>
            <p className="text-white/60 leading-relaxed normal-case">{page.competitorStrength}</p>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ side by side ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            mixreflect vs {page.competitor.toLowerCase()}
          </h2>
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${mono.className} border-b border-white/10 bg-[#0e0e0e] text-[12px]`}>
                  <th className="text-left px-5 py-4 font-medium text-white/35 w-1/4">&nbsp;</th>
                  <th className="text-left px-5 py-4 font-bold" style={{ color: ACCENT }}>mixreflect</th>
                  <th className="text-left px-5 py-4 font-medium text-white/60">{page.competitor.toLowerCase()}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {page.rows.map((row, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-5 py-4 font-bold text-white/85">{row.feature}</td>
                    <td className="px-5 py-4 text-white/70 normal-case">{row.mixreflect}</td>
                    <td className="px-5 py-4 text-white/45 normal-case">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* When to use which */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            which one should you use?
          </h2>
          <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
            <div className="bg-[#0a0a0a] p-7" style={{ boxShadow: `inset 0 2px 0 0 ${ACCENT}` }}>
              <h3 className={`${mono.className} font-bold text-[13px] mb-5 flex items-center gap-2`} style={{ color: ACCENT }}>
                <Check className="h-4 w-4" /> use mixreflect when
              </h3>
              <ul className="space-y-3">
                {page.whenMixreflect.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/70 text-[14px] leading-relaxed normal-case">
                    <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#0a0a0a] p-7">
              <h3 className={`${mono.className} font-bold text-[13px] text-white/55 mb-5 flex items-center gap-2`}>
                <X className="h-4 w-4" /> use {page.competitor.toLowerCase()} when
              </h3>
              <ul className="space-y-3">
                {page.whenCompetitor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/55 text-[14px] leading-relaxed normal-case">
                    <ArrowRight className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-white/45 mt-8 max-w-2xl leading-relaxed normal-case">
            They&apos;re not really competitors — they&apos;re sequential steps. Use MixReflect to get the track right, then {page.competitor} to put it in front of the right people.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ faq ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            {page.competitor.toLowerCase()} alternative — common questions
          </h2>
          <div className="grid gap-px bg-white/10 border border-white/10 max-w-3xl">
            {page.faq.map((item, i) => (
              <details key={i} className="group bg-[#0a0a0a] open:bg-[#0e0e0e] transition-colors">
                <summary className="flex items-start justify-between gap-4 cursor-pointer list-none p-6 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-[15px] font-extrabold tracking-tight leading-snug lowercase">
                    {item.q}
                  </h3>
                  <span
                    className={`${mono.className} shrink-0 text-[15px] leading-snug group-open:rotate-45 transition-transform`}
                    style={{ color: ACCENT }}
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 text-[13.5px] leading-relaxed text-white/55 normal-case">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <p className={`${mono.className} text-[12px] text-white/30 mb-4`}>[ related reading ]</p>
          <div className={`${mono.className} flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]`}>
            <Link href="/blog/best-music-feedback-platforms-2026" className="text-white/55 hover:text-white transition-colors">
              best music feedback platforms in 2026 →
            </Link>
            <Link href="/blog/mixreflect-vs-submithub" className="text-white/55 hover:text-white transition-colors">
              mixreflect vs submithub →
            </Link>
            <Link href="/blog/what-playlist-curators-look-for" className="text-white/55 hover:text-white transition-colors">
              what playlist curators actually look for →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#6ee7ff] text-black">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-black/55 mb-3`}>[ before you pitch ]</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-4 max-w-2xl">
            get your track right before you pitch it.
          </h2>
          <p className="text-black/70 mb-9 max-w-xl leading-relaxed normal-case">
            Paste your track and get an instant verdict on whether it&apos;s ready to release — backed by honest reactions from a room of real listeners. Free to submit — no credit card required.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold text-base px-8 py-4 hover:bg-[#141414] transition-colors"
          >
            score my track free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className={`${mono.className} max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40`}>
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/blog" className="hover:text-white transition-colors">the drop</Link>
            <Link href="/terms" className="hover:text-white transition-colors">terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
            <Link href="/support" className="hover:text-white transition-colors">contact</Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
