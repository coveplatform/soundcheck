import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Users, Zap, BarChart3, ListChecks, Lightbulb } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { Button } from "@/components/ui/button";
import { SignupLink } from "@/components/landing/signup-link";
import { getGenrePage, genrePages } from "@/lib/genre-pages";
import { getGenreDetail } from "@/lib/genre-pages-detail";
import { SITE_URL } from "@/lib/site";

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
    description: `MixReflect scores your ${page.name.toLowerCase()} track instantly with AI — a rating out of 100, a verdict and a breakdown across hook, production, retention, emotion and commercial pull — plus honest reactions from a room of real listeners.`,
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to submit — get your instant AI score and a teaser of the full report",
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
      icon: <Zap className="h-5 w-5 text-purple-400" />,
      step: "1",
      title: "Paste your track link",
      body: `Drop a SoundCloud, Bandcamp, or YouTube link — no upload, no account hoops. Free to submit your ${page.name.toLowerCase()} track.`,
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
      step: "2",
      title: "Get your instant AI read",
      body: `In seconds you get a score out of 100, a verdict, and a breakdown across hook, production, retention, emotion and commercial pull — tuned to what matters in ${page.name.toLowerCase()}.`,
    },
    {
      icon: <Users className="h-5 w-5 text-purple-400" />,
      step: "3",
      title: "A room of real listeners weighs in",
      body: "Then real listeners react with honest, specific takes as they land in your report. When several flag the same thing without seeing each other, that's the signal worth acting on.",
    },
  ];

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
          <li>
            <Link href="/" className="hover:text-neutral-700 transition-colors">
              Music Feedback
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-700 font-medium">{page.name} Feedback</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-500 mb-4">
            {page.name} · MixReflect
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-neutral-950 leading-[1.05]">
            {page.h1}
          </h1>
          <p className="mt-6 text-neutral-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            {page.intro}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignupLink>
              <Button
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-lg px-8 py-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[6px] active:translate-y-[6px] transition-all duration-150 ease-out"
              >
                Score my track free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignupLink>
          </div>
          <p className="mt-4 text-sm text-neutral-400">
            Free to submit · Instant AI score + real listeners · No credit card required
          </p>
        </div>
      </section>

      {/* What reviewers catch */}
      <section className="py-14 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-3">
            What {page.name} listeners actually catch
          </h2>
          <p className="text-neutral-500 mb-8 max-w-2xl leading-relaxed">
            {page.reviewerBlurb}
          </p>
          <ul className="space-y-4">
            {page.catchItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-[#faf8f5] rounded-xl px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="text-neutral-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-16 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map(({ step, title, body, icon }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                    {step}
                  </div>
                  {icon}
                </div>
                <h3 className="font-black text-neutral-950 mb-2">{title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-release checklist + pro tip */}
      {detail && (
        <section className="py-14 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-10">
              {/* Checklist */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="h-5 w-5 text-purple-500" />
                  <h2 className="text-2xl sm:text-3xl font-black text-neutral-950">
                    {page.name} pre-release checklist
                  </h2>
                </div>
                <p className="text-neutral-500 mb-6 leading-relaxed">
                  Before you release a {page.name.toLowerCase()} track, these are the things worth verifying. If you can&apos;t confidently check them yourself after dozens of listens, that&apos;s exactly what genre-matched feedback is for.
                </p>
                <ol className="space-y-3">
                  {detail.releaseChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-neutral-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Pro tip */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-purple-50 to-[#faf8f5] border border-purple-100 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-purple-500" />
                    <h3 className="font-black text-neutral-950 uppercase text-xs tracking-widest">
                      The one thing that helps most
                    </h3>
                  </div>
                  <p className="text-neutral-700 leading-relaxed text-[15px]">
                    {detail.proTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* The honest feedback problem */}
      <section className="py-14 sm:py-16 bg-neutral-950 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-black mb-4">
              Why you can&apos;t evaluate your own track
            </h2>
            <p className="text-neutral-400 leading-relaxed mb-4">
              After producing a track, you&apos;ve heard it hundreds of times. You know what the intro is building to, so it doesn&apos;t feel slow. You know the vocals are there, so the burial in the mix doesn&apos;t register. You&apos;re hearing your memory of the track, not the track itself.
            </p>
            <p className="text-neutral-400 leading-relaxed mb-4">
              A listener hearing it for the first time catches exactly what a new listener catches — no context, no forgiveness. That&apos;s the feedback that actually changes something before you release.
            </p>
            <p className="text-neutral-400 leading-relaxed mb-8">
              One person&apos;s note might be taste. When several independent listeners flag the same moment without seeing each other&apos;s responses, it&apos;s real — and it&apos;s almost always fixable before you put the track out.
            </p>
            <SignupLink>
              <Button className="bg-white text-neutral-950 hover:bg-neutral-100 font-black border-2 border-neutral-200 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Start free — no credit card <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </SignupLink>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 sm:py-16 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 mb-2">
            {page.name} music feedback — common questions
          </h2>
          <p className="text-neutral-500 mb-8">
            Everything you need to know about getting feedback on your {page.name.toLowerCase()} music.
          </p>
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

      {/* Internal links to blog */}
      <section className="py-10 bg-white border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
            Related guides
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/blog/how-to-get-feedback-on-music-before-releasing"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              How to get feedback on your music before releasing
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href="/blog/what-multiple-listeners-tell-you-that-one-person-cant"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              What 5 listeners tell you that 1 person can&apos;t
            </Link>
            <span className="text-neutral-300">·</span>
            <Link
              href="/blog/how-to-know-if-your-song-is-ready-to-release"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2"
            >
              How to know if your song is ready to release
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Ready to find out what&apos;s actually working?
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            Paste your {page.name.toLowerCase()} track and get an instant AI score plus honest reactions from a room of real listeners. Free to submit — no credit card required.
          </p>
          <SignupLink>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-neutral-100 font-black border-2 border-white text-base px-8 py-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Get feedback free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignupLink>
          <p className="mt-4 text-purple-300 text-sm">
            Free to submit · Instant AI score + real listeners · No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-neutral-900 text-neutral-50 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <Link href="/">
              <Logo className="text-white" />
            </Link>
            <p className="text-neutral-400">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
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
