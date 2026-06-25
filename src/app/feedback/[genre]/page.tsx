import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ArrowRight, CheckCircle2, Users, Zap, BarChart3, ListChecks, Lightbulb } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { getGenrePage, genrePages } from "@/lib/genre-pages";
import { getGenreDetail } from "@/lib/genre-pages-detail";
import { SITE_URL } from "@/lib/site";
import { FREE_FULL_READ } from "@/lib/score-free-tier";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function generateStaticParams() {
  return genrePages.map((p) => ({ genre: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const page = getGenrePage(genre);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `${SITE_URL}/feedback/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${SITE_URL}/feedback/${page.slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MixReflect" }],
    },
  };
}

export default async function GenreFeedbackPage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const page = getGenrePage(genre);
  if (!page) notFound();

  const detail = getGenreDetail(genre);

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
      { "@type": "ListItem", position: 2, name: "Music Feedback", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 3,
        name: `${page.name} Feedback`,
        item: `${SITE_URL}/feedback/${page.slug}`,
      },
    ],
  };

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MixReflect",
    applicationCategory: "MusicApplication",
    description: `MixReflect tells you whether your ${page.name.toLowerCase()} track is ready to release — an instant verdict, backed by a score out of 100 and a breakdown across hook, production, retention, emotion and commercial pull — plus honest reactions from a room of real listeners.`,
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: FREE_FULL_READ
        ? "Your first track's complete report is free — the release verdict, full written read and all three fixes"
        : "Free to submit — get your instant release verdict and a teaser of the full report",
    },
  };

  const howToJsonLd = detail
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to know if your ${page.name.toLowerCase()} track is ready to release`,
        description: `A pre-release checklist for ${page.name.toLowerCase()} artists — the things to verify before you put a track out.`,
        step: detail.releaseChecklist.map((item, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: item,
        })),
      }
    : null;

  const steps = [
    {
      icon: <Zap className="h-5 w-5" style={{ color: ACCENT }} />,
      step: "1",
      title: "paste your track link",
      body: `Drop a SoundCloud, Bandcamp, or YouTube link — no upload, no account hoops. Free to submit your ${page.name.toLowerCase()} track.`,
    },
    {
      icon: <BarChart3 className="h-5 w-5" style={{ color: ACCENT }} />,
      step: "2",
      title: "get your release verdict",
      body: `In seconds you get the verdict — is it ready to release? — backed by a score out of 100 and a breakdown across hook, production, retention, emotion and commercial pull, tuned to what matters in ${page.name.toLowerCase()}.`,
    },
    {
      icon: <Users className="h-5 w-5" style={{ color: ACCENT }} />,
      step: "3",
      title: "a room of real listeners weighs in",
      body: "Then real listeners react with honest, specific takes as they land in your report. When several flag the same thing without seeing each other, that's the signal worth acting on.",
    },
  ];

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

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
          <li>
            <Link href="/" className="hover:text-white transition-colors">
              music feedback
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-white/60">{page.name} feedback</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 pt-12 pb-16">
        <p className={`${mono.className} text-[13px] text-white/55 mb-4`}>
          [ {page.name.toLowerCase()} · mixreflect ]
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] leading-[1.02] max-w-3xl">
          {page.h1}
        </h1>
        <p className="mt-7 text-white/60 text-lg leading-relaxed max-w-2xl normal-case">
          {page.intro}
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors"
          >
            score my track free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className={`${mono.className} mt-4 text-[12px] text-white/40 normal-case`}>
            Free to submit · Instant release verdict + real listeners · No credit card required
          </p>
        </div>
      </section>

      {/* What reviewers catch */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            what {page.name.toLowerCase()} listeners actually catch
          </h2>
          <p className="text-white/55 mb-10 max-w-2xl leading-relaxed normal-case">
            {page.reviewerBlurb}
          </p>
          <ul className="grid gap-px bg-white/10 border border-white/10 max-w-3xl">
            {page.catchItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-[#0a0a0a] px-5 py-4">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                <span className="text-white/70 leading-relaxed normal-case">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ how it works ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            three steps. no hoops.
          </h2>
          <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {steps.map(({ step, title, body, icon }) => (
              <div key={step} className="bg-[#0a0a0a] p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className={`${mono.className} text-[13px] font-bold`} style={{ color: ACCENT }}>
                    0{step}
                  </span>
                  {icon}
                </div>
                <h3 className="font-extrabold tracking-tight mb-2">{title}</h3>
                <p className="text-white/50 text-[13.5px] leading-relaxed normal-case">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-release checklist + pro tip */}
      {detail && (
        <section className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <div className="grid lg:grid-cols-5 gap-10">
              {/* Checklist */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2.5 mb-4">
                  <ListChecks className="h-5 w-5" style={{ color: ACCENT }} />
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    {page.name.toLowerCase()} pre-release checklist
                  </h2>
                </div>
                <p className="text-white/55 mb-8 leading-relaxed normal-case">
                  Before you release a {page.name.toLowerCase()} track, these are the things worth verifying. If you can&apos;t confidently check them yourself after dozens of listens, that&apos;s exactly what genre-matched feedback is for.
                </p>
                <ol className="space-y-4">
                  {detail.releaseChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-3.5">
                      <span className={`${mono.className} text-[13px] font-bold flex-shrink-0 mt-0.5`} style={{ color: ACCENT }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-white/70 leading-relaxed normal-case">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Pro tip */}
              <div className="lg:col-span-2">
                <div className="border border-white/10 bg-[#0e0e0e] p-7 h-full" style={{ boxShadow: `inset 0 2px 0 0 ${ACCENT}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-4 w-4" style={{ color: ACCENT }} />
                    <h3 className={`${mono.className} font-bold text-[12px] text-white/55`}>
                      [ the one thing that helps most ]
                    </h3>
                  </div>
                  <p className="text-white/70 leading-relaxed text-[15px] normal-case">
                    {detail.proTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* The honest feedback problem */}
      <section className="border-t border-white/10 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5">
              why you can&apos;t evaluate your own track
            </h2>
            <p className="text-white/55 leading-relaxed mb-4 normal-case">
              After producing a track, you&apos;ve heard it hundreds of times. You know what the intro is building to, so it doesn&apos;t feel slow. You know the vocals are there, so the burial in the mix doesn&apos;t register. You&apos;re hearing your memory of the track, not the track itself.
            </p>
            <p className="text-white/55 leading-relaxed mb-4 normal-case">
              A listener hearing it for the first time catches exactly what a new listener catches — no context, no forgiveness. That&apos;s the feedback that actually changes something before you release.
            </p>
            <p className="text-white/55 leading-relaxed mb-9 normal-case">
              One person&apos;s note might be taste. When several independent listeners flag the same moment without seeing each other&apos;s responses, it&apos;s real — and it&apos;s almost always fixable before you put the track out.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold px-7 py-3.5 transition-colors"
            >
              start free — no credit card <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ faq ]</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            {page.name.toLowerCase()} music feedback — common questions
          </h2>
          <p className="text-white/55 mb-10 normal-case">
            Everything you need to know about getting feedback on your {page.name.toLowerCase()} music.
          </p>
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

      {/* Internal links to blog */}
      <section className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <p className={`${mono.className} text-[12px] text-white/30 mb-4`}>[ related guides ]</p>
          <div className={`${mono.className} flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]`}>
            <Link href="/blog/how-to-get-feedback-on-music-before-releasing" className="text-white/55 hover:text-white transition-colors">
              how to get feedback on your music before releasing →
            </Link>
            <Link href="/blog/what-multiple-listeners-tell-you-that-one-person-cant" className="text-white/55 hover:text-white transition-colors">
              what 5 listeners tell you that 1 person can&apos;t →
            </Link>
            <Link href="/blog/how-to-know-if-your-song-is-ready-to-release" className="text-white/55 hover:text-white transition-colors">
              how to know if your song is ready to release →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#6ee7ff] text-black">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <p className={`${mono.className} text-[13px] text-black/55 mb-3`}>[ hear the truth ]</p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-4 max-w-2xl">
            ready to find out what&apos;s actually working?
          </h2>
          <p className="text-black/70 mb-9 max-w-xl leading-relaxed normal-case">
            Paste your {page.name.toLowerCase()} track and get an instant verdict on whether it&apos;s ready to release — backed by honest reactions from a room of real listeners. Free to submit — no credit card required.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold text-base px-8 py-4 hover:bg-[#141414] transition-colors"
          >
            get feedback free <ArrowRight className="h-4 w-4" />
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
