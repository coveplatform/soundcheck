import Link from "next/link";
import { Caveat } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { ScoreRing } from "@/components/score/score-ring";
import {
  Sparkle,
  Star,
  Squiggle,
  Dots,
  Scribble,
  Zigzag,
} from "@/components/landing/doodles";
import { AnimatedSection } from "@/components/landing/animated-section";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Music,
  Share2,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const CATEGORY_SCORES = [
  { label: "Hook Strength", score: 4.2, pct: 84 },
  { label: "Production Quality", score: 3.8, pct: 76 },
  { label: "Listener Retention", score: 3.4, pct: 68 },
  { label: "Emotional Impact", score: 4.0, pct: 80 },
  { label: "Commercial Potential", score: 3.6, pct: 72 },
];

export default function ScorePage() {
  return (
    <div
      className="min-h-screen bg-[#faf8f5] text-neutral-950"
      style={{ paddingTop: "56px" }}
    >
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <AuthButtons theme="light" />
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO (dark, dramatic) ─────────────────────── */}
      <section className="bg-neutral-950 text-white min-h-[92vh] flex items-center overflow-hidden relative">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.14]"
            style={{
              background:
                "radial-gradient(circle, #9333ea 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute -top-32 right-0 w-80 h-80 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, #a855f7 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-24 left-0 w-64 h-64 rounded-full opacity-8"
            style={{
              background:
                "radial-gradient(circle, #c084fc 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28 relative w-full">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            {/* ── TEXT SIDE ── */}
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-600/15 border border-purple-500/20 rounded-full px-3 py-1.5 text-[11px] font-black text-purple-300 uppercase tracking-wider mb-7">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Track Score · One-time · $9
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">
                Your track
                <br />
                <span className="text-purple-400">has a score.</span>
              </h1>

              <p className="mt-6 text-neutral-400 text-lg sm:text-xl leading-relaxed max-w-md">
                5 real listeners review it. You get a number out of 100, a
                percentile, and exactly what to fix. Results in 24 hours.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link href="/submit-score">
                  <button className="group inline-flex items-center gap-2.5 bg-purple-600 text-white hover:bg-purple-500 font-black text-base px-7 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Get My Score
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    <span className="text-purple-300 font-bold ml-1">$9</span>
                  </button>
                </Link>
                <Link href="/report/demo">
                  <button className="inline-flex items-center gap-2 bg-white/6 text-white/80 hover:bg-white/10 hover:text-white font-semibold text-base px-6 py-4 rounded-xl border border-white/12 transition-all">
                    See a sample report
                  </button>
                </Link>
              </div>

              <p className="mt-5 text-sm text-white/30 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-white/25" />
                Delivered to your inbox within 24 hours · No subscription
              </p>
            </div>

            {/* ── SCORE RING SIDE ── */}
            <div className="flex flex-col items-center justify-center relative">
              {/* Doodles */}
              <Sparkle className="absolute -top-4 -left-2 sm:-left-8 w-10 h-10 text-purple-400/60 -rotate-12 pointer-events-none" />
              <Star className="absolute top-2 right-2 sm:-right-4 w-7 h-7 text-orange-400/70 rotate-12 pointer-events-none" />
              <Dots className="absolute -bottom-4 left-4 w-10 h-10 text-white/15 rotate-6 pointer-events-none" />

              {/* Glow behind ring */}
              <div
                className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-25 pointer-events-none"
                style={{ background: "#9333ea" }}
              />

              <div className="relative flex flex-col items-center gap-5">
                <ScoreRing score={82} size="xl" dark animate />

                <div className="flex flex-col items-center gap-2.5">
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm font-black text-purple-300">
                    Top 27% of tracks
                  </div>
                  <div className="bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-300">
                    Almost There
                  </div>
                </div>
              </div>

              {/* Floating mini cards */}
              <div className="absolute top-10 -right-6 sm:-right-14 lg:-right-20 bg-neutral-900/90 backdrop-blur border border-white/8 rounded-2xl p-3.5 shadow-2xl w-44 hidden sm:block">
                <p className="text-[9px] text-white/30 font-mono mb-1.5 uppercase tracking-wider">
                  Reviewer 2
                </p>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-purple-500"
                    />
                  ))}
                  <div className="w-2 h-2 rounded-full bg-white/12" />
                </div>
                <p className="text-[11px] text-white/55 leading-relaxed">
                  &ldquo;Hook lands perfectly. Production is clean.&rdquo;
                </p>
              </div>

              <div className="absolute bottom-10 -left-6 sm:-left-14 lg:-left-20 bg-neutral-900/90 backdrop-blur border border-white/8 rounded-2xl p-3.5 shadow-2xl w-40 hidden sm:block">
                <p className="text-[9px] text-white/30 font-mono mb-1.5 uppercase tracking-wider">
                  Reviewer 4
                </p>
                <div className="flex gap-0.5 mb-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-amber-500"
                    />
                  ))}
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/12"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-white/55 leading-relaxed">
                  &ldquo;Intro is 10s too long before the drop.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────── */}
      <div className="bg-neutral-950 border-t border-white/5 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-around text-center">
            {[
              { val: "2,847", label: "tracks scored", color: "text-white" },
              { val: "<24h", label: "avg delivery", color: "text-purple-400" },
              {
                val: "5",
                label: "real listeners per report",
                color: "text-white",
              },
              { val: "$9", label: "flat · no subscription", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label}>
                <p
                  className={`text-3xl sm:text-4xl font-black tabular-nums ${item.color}`}
                >
                  {item.val}
                </p>
                <p className="text-[11px] text-white/35 font-medium mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT YOU GET ─────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#faf8f5] overflow-visible">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/25 mb-3">
              What&apos;s inside
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">
              One report.
              <br />
              Three things that matter.
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                icon: BarChart3,
                title: "Your Score",
                sub: "0 – 100",
                desc: "A single number averaged across 5 real reviewers who listened to your full track. No algorithm. No guessing.",
                accent: "bg-purple-600",
                ring: "ring-purple-100",
                txt: "text-purple-600",
              },
              {
                n: "02",
                icon: Users,
                title: "Your Percentile",
                sub: "Where you rank",
                desc: "Your track is benchmarked against every other track scored on MixReflect. See if you're in the top 10% or still climbing.",
                accent: "bg-amber-500",
                ring: "ring-amber-100",
                txt: "text-amber-600",
              },
              {
                n: "03",
                icon: Zap,
                title: "Your Feedback",
                sub: "What to fix",
                desc: "The top 2–3 things that would move your score up. Specific, actionable, from real people who actually listened.",
                accent: "bg-emerald-600",
                ring: "ring-emerald-100",
                txt: "text-emerald-600",
              },
            ].map((item) => (
              <AnimatedSection key={item.n}>
                <div className="bg-white rounded-2xl border border-black/6 p-7 h-full hover:shadow-lg transition-shadow">
                  <div
                    className={`inline-flex w-11 h-11 rounded-xl ${item.accent} items-center justify-center mb-5 ring-4 ${item.ring}`}
                  >
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-neutral-950 mb-0.5">
                    {item.title}
                  </h3>
                  <p className={`text-[11px] font-black uppercase tracking-wider mb-3 ${item.txt}`}>
                    {item.sub}
                  </p>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE REPORT TEASER ─────────────────────── */}
      <section className="bg-neutral-950 py-16 sm:py-24 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(147,51,234,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-4xl mx-auto px-4 relative">
          <AnimatedSection className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/25 mb-3">
              Sample report
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05]">
              Here&apos;s what you&apos;ll get.
            </h2>
            <p className="mt-3 text-neutral-500 text-base max-w-sm mx-auto">
              A real report. Score, percentile, feedback. Delivered to your
              inbox.
            </p>
          </AnimatedSection>

          <AnimatedSection className="relative">
            <div className="bg-neutral-900 rounded-2xl border border-white/8 overflow-hidden shadow-2xl">
              {/* Report header */}
              <div className="px-5 sm:px-7 py-4 border-b border-white/8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-600/25 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <Music className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">
                      MixReflect Score Report
                    </p>
                    <p className="text-[10px] text-white/35 font-mono">
                      Sample Track · 5 reviewers · May 2025
                    </p>
                  </div>
                </div>
                <div className="bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1 text-[10px] font-black text-amber-300 uppercase tracking-widest flex-shrink-0">
                  Almost There
                </div>
              </div>

              {/* Score + categories */}
              <div className="px-5 sm:px-7 py-8 flex flex-col sm:flex-row items-center gap-8">
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <ScoreRing
                    score={82}
                    size="lg"
                    dark
                    animate={false}
                  />
                  <div className="text-center">
                    <div className="bg-purple-600/20 border border-purple-500/25 rounded-full px-3 py-1 text-xs font-black text-purple-300">
                      Top 27% of tracks
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">
                    Score breakdown
                  </p>
                  {CATEGORY_SCORES.map((cat) => (
                    <div key={cat.label} className="flex items-center gap-3">
                      <span className="text-[11px] text-white/40 w-36 shrink-0">
                        {cat.label}
                      </span>
                      <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-white/50 w-8 text-right tabular-nums">
                        {cat.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blurred feedback section */}
              <div className="relative px-5 sm:px-7 pb-7">
                <div className="blur-sm select-none pointer-events-none space-y-3">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/6">
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-2">
                      What reviewers said
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      &ldquo;The hook lands perfectly at 0:45 and is instantly
                      memorable. The synth layering in the drop is really
                      well done — everything sits nicely in the mix...&rdquo;
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/6">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
                      Priority improvements
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      1. Trim the intro by 8–12 seconds to reach the hook
                      faster. Mentioned by 4 of 5 reviewers.
                      <br />
                      2. The vocal competes with the lead synth around 1:30...
                    </p>
                  </div>
                </div>

                {/* Unlock overlay */}
                <div className="absolute inset-0 flex items-end justify-center pb-7 bg-gradient-to-t from-neutral-900/85 via-neutral-900/40 to-transparent rounded-b-2xl">
                  <Link href="/submit-score">
                    <button className="inline-flex items-center gap-2.5 bg-purple-600 text-white hover:bg-purple-500 font-black text-sm px-6 py-3.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                      Get your full report
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-purple-300 font-bold">— $9</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#faf8f5] overflow-visible relative">
        <div className="max-w-4xl mx-auto px-4">
          {/* Doodles */}
          <Sparkle className="absolute -top-6 -left-10 sm:-left-20 w-14 h-14 text-neutral-950/20 rotate-6 hidden sm:block pointer-events-none" />
          <Zigzag className="absolute top-20 -right-10 sm:-right-20 w-8 h-20 text-purple-400/40 rotate-3 hidden sm:block pointer-events-none" />

          <AnimatedSection className="mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/25 mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]">
              Simple. Fast. Honest.
            </h2>
          </AnimatedSection>

          <div className="space-y-10">
            {[
              {
                n: "01",
                title: "Submit your track",
                desc: "Paste your SoundCloud, Spotify, or direct audio link. Pick your genre. Add any notes. That's it.",
                time: "Takes 60 seconds",
                color: "bg-purple-600",
              },
              {
                n: "02",
                title: "5 real listeners review it",
                desc: "Genre-matched artists on MixReflect listen to your full track and score it across 5 dimensions. Real ears, real opinions.",
                time: "Usually within 12 hours",
                color: "bg-amber-500",
              },
              {
                n: "03",
                title: "Get your full report",
                desc: "We email you the complete report: your score, percentile ranking, individual reviewer quotes, and the top improvements.",
                time: "Within 24 hours, guaranteed",
                color: "bg-emerald-600",
              },
            ].map((step, i) => (
              <AnimatedSection key={step.n}>
                <div className="flex items-start gap-6">
                  <div
                    className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${step.color} text-white flex items-center justify-center font-black text-sm`}
                  >
                    {step.n}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-black text-neutral-950">
                      {step.title}
                    </h3>
                    <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                    <p
                      className={`text-[11px] font-black mt-2 uppercase tracking-wider ${step.color.replace("bg-", "text-")}`}
                    >
                      {step.time}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────── */}
      <section className="py-14 bg-neutral-950">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div
            className={`${caveat.className} text-4xl text-purple-300/80 mb-2`}
          >
            &ldquo;
          </div>
          <p className="text-lg sm:text-xl text-white/75 leading-relaxed font-medium">
            I scored 67. Found out 4 of 5 reviewers said my intro was too
            slow. Cut 10 seconds. My next release got 8x the streams.
          </p>
          <p className="mt-4 text-sm text-white/30">
            Marcus T. · Electronic Producer
          </p>
        </div>
      </section>

      {/* ── SHARE YOUR SCORE ─────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/25 mb-3">
              Built for sharing
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.05]">
              Show the world your score.
            </h2>
            <p className="mt-4 text-neutral-600 text-base max-w-md mx-auto">
              Every report comes with a shareable link and a score card ready
              for Instagram Stories, Twitter, or Discord.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
              {/* Sample share card */}
              <div className="w-56 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
                <div
                  className="p-5 flex flex-col items-center gap-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #1a0533 0%, #2d1060 50%, #0f0f0f 100%)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg
                      viewBox="0 0 200 200"
                      className="h-5 w-5"
                    >
                      <rect
                        x="10" y="10" width="180" height="180"
                        rx="40" ry="40" fill="#9333ea"
                      />
                      <g fill="white">
                        <rect x="42" y="78" width="16" height="44" rx="3" />
                        <rect x="68" y="55" width="16" height="90" rx="3" />
                        <rect x="94" y="38" width="16" height="124" rx="3" />
                        <rect x="120" y="62" width="16" height="76" rx="3" />
                        <rect x="146" y="82" width="16" height="36" rx="3" />
                      </g>
                    </svg>
                    <span className="text-[11px] font-black text-white/70">
                      MixReflect
                    </span>
                  </div>
                  <ScoreRing score={82} size="md" dark animate={false} />
                  <div className="text-center">
                    <p className="text-xs font-black text-purple-300">
                      Top 27% of tracks
                    </p>
                    <p className="text-[10px] text-amber-300 font-black uppercase tracking-wider mt-0.5">
                      Almost There
                    </p>
                  </div>
                  <p className="text-[9px] text-white/25 font-mono">
                    mixreflect.com/score
                  </p>
                </div>
              </div>

              {/* Share feature list */}
              <div className="space-y-4 max-w-xs">
                {[
                  {
                    icon: Share2,
                    title: "Shareable link",
                    desc: "Permanent URL for your report. Share with your producer or anyone.",
                  },
                  {
                    icon: Music,
                    title: "Score card",
                    desc: "A clean image showing your score and percentile. Ready to post.",
                  },
                  {
                    icon: BarChart3,
                    title: "Full breakdown",
                    desc: "Every category score, every reviewer quote, all in one place.",
                  },
                ].map((feat) => (
                  <div key={feat.title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <feat.icon className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-neutral-950">
                        {feat.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-[#faf8f5] overflow-visible relative">
        <div className="max-w-lg mx-auto px-4">
          {/* Doodles */}
          <Sparkle className="absolute -top-6 -left-10 sm:-left-24 w-14 h-14 text-purple-400/80 -rotate-12 hidden sm:block pointer-events-none" />
          <Squiggle className="absolute -bottom-6 -right-10 sm:-right-24 w-20 h-20 text-orange-300/60 rotate-6 hidden sm:block pointer-events-none" />
          <Star className="absolute top-12 -right-6 sm:-right-16 w-10 h-10 text-neutral-950/10 rotate-15 hidden sm:block pointer-events-none" />

          <AnimatedSection>
            <div className="bg-white rounded-2xl border border-black/8 p-8 sm:p-10 text-center shadow-xl shadow-black/5">
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-7">
                One-time · No subscription
              </div>

              <div className="text-8xl font-black text-neutral-950 leading-none tracking-tight">
                $9
              </div>
              <p className="text-sm text-neutral-400 mt-2 mb-9">
                Per track · Results in 24 hours
              </p>

              <div className="text-left space-y-3.5 mb-9">
                {[
                  "MixReflect Score out of 100",
                  "Percentile rank vs. all tracks reviewed",
                  "5 real reviewer scores across 5 dimensions",
                  "Reviewer quotes (anonymised)",
                  "AI-synthesised written summary",
                  "Top 2–3 priority improvements",
                  "Permanent shareable report link",
                  "Delivered to your inbox within 24 hours",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/submit-score">
                <button className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 font-black text-base py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all">
                  Get My Score — $9
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>

              <p className="mt-4 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" />
                Secure payment via Stripe
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="py-16 bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-black mb-8">Questions</h2>
          <div className="rounded-2xl bg-white border border-black/6 overflow-hidden shadow-sm">
            {[
              {
                q: "How is the score calculated?",
                a: "5 genre-matched reviewers listen to your full track and score it across 5 dimensions: Hook Strength, Production Quality, Listener Retention, Emotional Impact, and Commercial Potential. Scores are averaged into a single 0–100 number.",
              },
              {
                q: "Who are the reviewers?",
                a: "Real artists on the MixReflect platform who share your genre. Everyone is both an artist and a reviewer. Low-quality reviewers are removed based on ratings — so feedback stays useful and honest.",
              },
              {
                q: "How long does it take?",
                a: "We guarantee delivery within 24 hours. Most reports are ready within 12 hours.",
              },
              {
                q: "Can I submit an unreleased or private track?",
                a: "Yes. Your track URL is only shared with the 5 reviewers. It's never published or made public without your permission.",
              },
              {
                q: "What if the feedback feels low quality?",
                a: "If reviewers clearly didn't engage with the track properly, contact us and we'll re-run it at no charge. Quality feedback is the whole product.",
              },
              {
                q: "Do I need a MixReflect account?",
                a: "No. You can submit with just your email. If you have an account, your report will appear in your dashboard too.",
              },
            ].map((item, i, arr) => (
              <details
                key={item.q}
                className={`p-5 ${i < arr.length - 1 ? "border-b border-black/5" : ""}`}
              >
                <summary className="font-bold cursor-pointer hover:text-neutral-700 text-neutral-950 select-none">
                  {item.q}
                </summary>
                <p className="mt-2.5 text-sm text-neutral-600 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="py-24 bg-neutral-950 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 60%, rgba(147,51,234,0.18) 0%, transparent 70%)",
          }}
        />
        <Scribble className="absolute top-10 left-10 w-24 h-16 text-white/5 pointer-events-none hidden sm:block" />

        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.0]">
            Stop guessing.
            <br />
            <span className="text-purple-400">Know your score.</span>
          </h2>
          <p className="mt-5 text-neutral-500 text-lg">
            One number. Real feedback. $9.
          </p>
          <div className="mt-9">
            <Link href="/submit-score">
              <button className="inline-flex items-center gap-2.5 bg-purple-600 text-white hover:bg-purple-500 font-black text-lg px-9 py-5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Get My Score
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-neutral-600">
            No account needed · Secure payment via Stripe
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="py-8 bg-neutral-900 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <Link href="/">
              <Logo className="text-white" />
            </Link>
            <p className="text-neutral-500">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
            <div className="flex items-center gap-4 text-neutral-400">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
