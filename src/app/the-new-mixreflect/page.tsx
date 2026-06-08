import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { ArrowRight, Zap, Users, Headphones, Check, Wallet } from "lucide-react";
import { SCORE_REVIEW_RATE_CENTS, SCORE_PAYOUT_THRESHOLD_CENTS } from "@/lib/score-review";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

const RATE = (SCORE_REVIEW_RATE_CENTS / 100).toFixed(2);
const THRESHOLD = (SCORE_PAYOUT_THRESHOLD_CENTS / 100).toFixed(0);

export const metadata: Metadata = {
  title: "MixReflect is changing — the new MixReflect",
  description:
    "MixReflect is becoming a faster, sharper way to get feedback on your music: an instant AI read plus reactions from a room of real listeners. Here's what's changing.",
};

export default function TheNewMixReflectPage() {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/score">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/score" className={`${mono.className} text-[13px] bg-[#6ee7ff] text-black px-3.5 py-1.5 font-bold hover:bg-white transition-colors`}>
            try it free →
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pt-16 pb-10 text-center">
        <p className={`${mono.className} text-[13px] text-white/55 mb-4`}>[ mixreflect is changing ]</p>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em] leading-[0.9] mb-6">
          a sharper way to<br />get <span style={{ color: ACCENT }}>feedback</span>.
        </h1>
        <p className="text-white/70 text-lg sm:text-xl max-w-xl mx-auto normal-case leading-relaxed">
          We&apos;ve rebuilt MixReflect from the ground up. Same idea — honest feedback before you
          release — but instant, and from real ears.
        </p>
        <div className="mt-9 flex flex-wrap gap-3 justify-center">
          <Link href="/score" className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-7 py-4 hover:bg-white transition-colors">
            get my track scored
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/reviewer" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-extrabold text-base px-7 py-4 transition-colors">
            <Wallet className="h-4 w-4" /> get paid to review
          </Link>
        </div>
      </section>

      {/* what's new — 2 cards */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-8">
        <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
          <div className="bg-[#0a0a0a] p-7">
            <Zap className="h-6 w-6 mb-4" style={{ color: ACCENT }} />
            <h3 className="text-xl font-extrabold mb-2">instant ai read</h3>
            <p className="text-white/65 text-[14.5px] normal-case leading-relaxed">
              Paste a link, get a score out of 100, a verdict and a breakdown across hook, production,
              retention, emotion and commercial pull — in seconds.
            </p>
          </div>
          <div className="bg-[#0a0a0a] p-7">
            <Users className="h-6 w-6 mb-4" style={{ color: ACCENT }} />
            <h3 className="text-xl font-extrabold mb-2">a room of real listeners</h3>
            <p className="text-white/65 text-[14.5px] normal-case leading-relaxed">
              Then real, <strong className="text-white/85">paid</strong> listeners react — honest, specific
              takes that land in your report as they come in. No grinding for credits, no waiting days.
            </p>
          </div>
        </div>
      </section>

      {/* two ways in */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/score" className="group border border-white/12 bg-[#101010] p-7 hover:border-white/30 transition-colors flex flex-col">
            <p className={`${mono.className} text-[12px] text-white/45 mb-2`}>for artists</p>
            <h3 className="text-2xl font-extrabold mb-2">drop a track</h3>
            <p className="text-white/60 text-[14px] normal-case leading-relaxed flex-1">
              Get your instant read free, then unlock the full thing and watch the room weigh in.
            </p>
            <span className={`${mono.className} mt-5 inline-flex items-center gap-1.5 text-[13px] group-hover:gap-2.5 transition-all`} style={{ color: ACCENT }}>
              score a track →
            </span>
          </Link>
          <Link href="/reviewer" className="group border border-white/12 bg-[#101010] p-7 hover:border-white/30 transition-colors flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className={`${mono.className} text-[12px] text-white/45`}>for listeners</p>
              <span className={`${mono.className} text-[12px] font-bold px-2 py-0.5 border`} style={{ color: ACCENT, borderColor: "rgba(110,231,255,0.4)" }}>
                ${RATE}/review
              </span>
            </div>
            <h3 className="text-2xl font-extrabold mb-2">get paid to listen</h3>
            <p className="text-white/60 text-[14px] normal-case leading-relaxed flex-1">
              Be one of the listeners artists get played for. Hear unreleased tracks first and earn
              ${RATE} for every honest two-minute reaction — cash out at ${THRESHOLD}. Sign up in one click.
            </p>
            <span className={`${mono.className} mt-5 inline-flex items-center gap-1.5 text-[13px] group-hover:gap-2.5 transition-all`} style={{ color: ACCENT }}>
              start earning →
            </span>
          </Link>
        </div>
      </section>

      {/* pricing strip */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-8">
        <p className={`${mono.className} text-[12px] text-white/45 mb-4 text-center`}>simple pricing</p>
        <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {[
            { p: "free", s: "submit + your score, verdict & teaser" },
            { p: "$6.95", s: "unlock one full report — yours forever" },
            { p: "$19.95/mo", s: "unlimited — every track auto-unlocked", hot: true },
          ].map((t) => (
            <div key={t.p} className="bg-[#0a0a0a] p-6 text-center relative">
              {t.hot && <div className="absolute top-0 left-0 h-0.5 w-full" style={{ background: ACCENT }} />}
              <p className="text-2xl font-extrabold" style={t.hot ? { color: ACCENT } : undefined}>{t.p}</p>
              <p className="text-white/55 text-[13px] normal-case mt-1.5 leading-snug">{t.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pro + timeline + support — compact */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-8 space-y-4">
        <div className="border-2 bg-[#0c0c0c] p-6 flex items-start gap-3.5" style={{ borderColor: "rgba(110,231,255,0.35)" }}>
          <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <p className="text-white/80 text-[15px] normal-case leading-relaxed">
            <strong style={{ color: ACCENT }}>Already a MixReflect Pro?</strong> You&apos;ll be made Pro
            on the new site automatically — same login, unlimited access carries straight over. Nothing to do.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-white/12 bg-[#101010] p-6">
            <h3 className={`${mono.className} text-[13px] mb-2`} style={{ color: ACCENT }}>the timeline</h3>
            <p className="text-white/70 text-[14px] normal-case leading-relaxed">
              We&apos;re phasing out <strong>MixReflect Classic over about the next week.</strong> It stays
              up until then so you can wrap up anything in progress.
            </p>
          </div>
          <div className="border border-white/12 bg-[#101010] p-6">
            <h3 className={`${mono.className} text-[13px] mb-2`} style={{ color: ACCENT }}>questions?</h3>
            <p className="text-white/70 text-[14px] normal-case leading-relaxed">
              We&apos;re here to help — your account, your subscription, anything. Email{" "}
              <a href="mailto:support@mixreflect.com" className="font-bold hover:underline" style={{ color: ACCENT }}>
                support@mixreflect.com
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 py-12 text-center">
        <Link href="/score" className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-lg px-9 py-4 hover:bg-white transition-colors">
          try the new mixreflect
          <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <p className={`${mono.className} text-[12px] text-white/35 mt-4 normal-case`}>
          free to submit · your account works as-is
        </p>
      </section>
    </div>
  );
}
