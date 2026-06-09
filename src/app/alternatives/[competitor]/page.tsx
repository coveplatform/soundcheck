import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { Button } from "@/components/ui/button";
import { SignupLink } from "@/components/landing/signup-link";
import { getAlternativePage, alternativePages } from "@/lib/alternatives";
import { SITE_URL } from "@/lib/site";

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
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950" style={{ paddingTop: "56px" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <AuthButtons theme="light" />
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 pt-5 pb-2">
        <ol className="flex items-center gap-2 text-xs text-neutral-400">
          <li>
            <Link href="/" className="hover:text-neutral-700 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-700 font-medium">{page.competitor} Alternative</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-18 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500 mb-4">
            {page.competitor} Alternative
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-[1.05]">
            {page.h1}
          </h1>
        </div>
      </section>

      {/* Verdict / TL;DR */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-[#faf8f5] border-l-4 border-purple-500 rounded-r-xl p-6">
            <p className="text-xs font-black uppercase tracking-widest text-purple-500 mb-2">
              The short version
            </p>
            <p className="text-neutral-700 leading-relaxed text-lg">{page.verdict}</p>
          </div>
        </div>
      </section>

      {/* What the competitor is */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-black text-neutral-950 mb-4">
            What {page.competitor} is — and what it&apos;s good at
          </h2>
          <p className="text-neutral-600 leading-relaxed mb-4">{page.competitorWhat}</p>
          <p className="text-neutral-600 leading-relaxed">{page.competitorStrength}</p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-12 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-8 text-center">
            MixReflect vs {page.competitor}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-4 font-black text-neutral-500 text-xs uppercase tracking-wider w-1/4">
                    &nbsp;
                  </th>
                  <th className="text-left px-4 py-4 font-black text-purple-600">MixReflect</th>
                  <th className="text-left px-4 py-4 font-black text-neutral-700">{page.competitor}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {page.rows.map((row, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-4 py-4 font-bold text-neutral-900">{row.feature}</td>
                    <td className="px-4 py-4 text-neutral-700">{row.mixreflect}</td>
                    <td className="px-4 py-4 text-neutral-500">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* When to use which */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-8 text-center">
            Which one should you use?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
              <h3 className="font-black text-purple-700 mb-4 flex items-center gap-2">
                <Check className="h-5 w-5" /> Use MixReflect when
              </h3>
              <ul className="space-y-3">
                {page.whenMixreflect.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-neutral-700 text-sm leading-relaxed">
                    <Check className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
              <h3 className="font-black text-neutral-700 mb-4 flex items-center gap-2">
                <X className="h-5 w-5" /> Use {page.competitor} when
              </h3>
              <ul className="space-y-3">
                {page.whenCompetitor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-neutral-600 text-sm leading-relaxed">
                    <ArrowRight className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-neutral-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            They&apos;re not really competitors — they&apos;re sequential steps. Use MixReflect to get the track right, then {page.competitor} to put it in front of the right people.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-8">
            {page.competitor} alternative — common questions
          </h2>
          <div className="space-y-0 rounded-2xl bg-white shadow-md overflow-hidden divide-y divide-neutral-100">
            {page.faq.map((item, i) => (
              <details key={i} className="p-5 group">
                <summary className="font-extrabold cursor-pointer text-neutral-950 hover:text-neutral-700 list-none flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-purple-500 text-lg flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-neutral-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-10 bg-white border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
            Related reading
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog/best-music-feedback-platforms-2026"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              Best music feedback platforms in 2026
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href="/blog/mixreflect-vs-submithub"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              MixReflect vs SubmitHub: what&apos;s the difference
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href="/blog/what-playlist-curators-look-for"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              What playlist curators actually look for
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Get your track right before you pitch it
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            Paste your track and get an instant AI score plus honest reactions from a room of real listeners. Free to submit — no credit card required.
          </p>
          <SignupLink>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-neutral-100 font-black border-2 border-white text-base px-8 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Score my track free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignupLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-neutral-900 text-neutral-50 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <Link href="/">
              <Logo className="text-white" />
            </Link>
            <p className="text-neutral-400">&copy; {new Date().getFullYear()} MixReflect</p>
            <div className="flex items-center gap-4 text-neutral-300">
              <Link href="/blog" className="hover:text-white font-medium transition-colors">
                The Drop
              </Link>
              <Link href="/terms" className="hover:text-white font-medium transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white font-medium transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-white font-medium transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
