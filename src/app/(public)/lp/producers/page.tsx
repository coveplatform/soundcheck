import Link from "next/link";
import { Caveat } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { Sparkle, Star, Squiggle, Dots, Scribble, Zigzag } from "@/components/landing/doodles";
import { SignupLink } from "@/components/landing/signup-link";
import { ArrowRight, Check, MessageSquare, BarChart2, Clock, Star as StarIcon } from "lucide-react";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export const metadata = {
  title: "Real producers reviewed my track — MixReflect",
  description: "Submit your track. Get honest, structured feedback from producers in your genre. No clout-chasers, no yes-men.",
  robots: { index: false },
};

// ── Mock review cards ─────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  {
    handle: "beatmaker_AU",
    timeAgo: "2h ago",
    scores: { mix: 7, arrangement: 8, energy: 9 },
    quote: "The drop hits hard but you're losing low-end clarity on laptop speakers — your kick and bass are fighting around 80Hz. High-pass the bass at 60Hz and you're done. Arrangement is genuinely strong.",
    verdict: "FIX FIRST",
    verdictColor: "amber",
    genre: "Future Bass",
  },
  {
    handle: "lofi_prod_NYC",
    timeAgo: "4h ago",
    scores: { mix: 6, arrangement: 9, energy: 8 },
    quote: "Loved the chord progression — seriously. The mix needs work though. Vocals are sitting too loud by about 2dB in the chorus, and there's a harsh resonance around 3.5kHz. 20 minutes in Fab Filter and this is release-ready.",
    verdict: "FIX FIRST",
    verdictColor: "amber",
    genre: "Lo-fi Hip Hop",
  },
  {
    handle: "drumdesign_SE",
    timeAgo: "6h ago",
    scores: { mix: 9, arrangement: 8, energy: 10 },
    quote: "This slaps. The transients on the snare are punchy without being fatiguing. Structure is tight. Honestly I'd release this today — maybe check the stereo width on the lead in the breakdown but that's a taste thing.",
    verdict: "RELEASE NOW",
    verdictColor: "lime",
    genre: "Drum & Bass",
  },
];

const STATS = [
  { value: "2,847", label: "tracks reviewed" },
  { value: "< 4hrs", label: "avg turnaround" },
  { value: "94%", label: "artist satisfaction" },
];

const HOW_STEPS = [
  { num: "01", title: "Submit your track", body: "Drop a SoundCloud or Spotify link, or upload an MP3. Set your genre and any notes for reviewers." },
  { num: "02", title: "Genre-matched reviewers get assigned", body: "Producers who actually make music in your genre listen and give structured notes — not just vibes." },
  { num: "03", title: "Get scores, timestamps & honest takes", body: "Every review includes ratings, specific timestamps, and a release verdict. Signal, not noise." },
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function VerdictPill({ verdict, color }: { verdict: string; color: string }) {
  const styles: Record<string, string> = {
    lime: "bg-lime-400 text-black border-black",
    amber: "bg-amber-400 text-black border-black",
  };
  return (
    <span className={`inline-block border-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[color] ?? "bg-neutral-200 text-black border-black"}`}>
      {verdict}
    </span>
  );
}

function ScoreDot({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xl font-black text-black tabular-nums">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-wider text-black/40">{label}</span>
    </div>
  );
}

function ReviewCard({ review, rotateClass = "" }: { review: typeof MOCK_REVIEWS[0]; rotateClass?: string }) {
  return (
    <div className={`bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 ${rotateClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-100 border-2 border-black flex items-center justify-center">
            <span className="text-[10px] font-black text-purple-700">{review.handle.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-xs font-black text-black">@{review.handle}</p>
            <p className="text-[10px] text-black/40">{review.genre} · {review.timeAgo}</p>
          </div>
        </div>
        <VerdictPill verdict={review.verdict} color={review.verdictColor} />
      </div>

      {/* Scores */}
      <div className="flex items-center gap-5 mb-3 pb-3 border-b-2 border-black/6">
        <ScoreDot label="Mix" value={review.scores.mix} />
        <ScoreDot label="Arrange" value={review.scores.arrangement} />
        <ScoreDot label="Energy" value={review.scores.energy} />
      </div>

      {/* Quote */}
      <p className="text-sm text-black/75 leading-relaxed">{review.quote}</p>
    </div>
  );
}

function CtaButton({ text = "Get feedback on my track", className = "" }: { text?: string; className?: string }) {
  return (
    <SignupLink className={`inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-black border-2 border-black px-6 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-sm sm:text-base ${className}`}>
      {text} <ArrowRight className="h-4 w-4" />
    </SignupLink>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProducersLandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-950">

      {/* ── Minimal header ───────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]/90 backdrop-blur-sm border-b border-black/6">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-black/50 hover:text-black transition-colors hidden sm:block">
              Log in
            </Link>
            <SignupLink className="bg-black text-white text-sm font-black px-4 py-2 rounded-xl border-2 border-black hover:bg-neutral-800 transition-colors">
              Sign up free
            </SignupLink>
          </div>
        </div>
      </header>

      <div className="pt-14">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#faf8f5] pt-12 pb-16 sm:pt-20 sm:pb-24">

          {/* Decorative doodles */}
          <Sparkle className="pointer-events-none absolute top-8 right-[8%] w-14 h-14 text-purple-400 opacity-60 -rotate-12 hidden sm:block" />
          <Star className="pointer-events-none absolute top-24 left-[4%] w-8 h-8 text-lime-400 opacity-80 rotate-6 hidden sm:block" />
          <Squiggle className="pointer-events-none absolute bottom-12 left-[6%] w-20 h-20 text-orange-300 opacity-50 rotate-[20deg] hidden md:block" />
          <Dots className="pointer-events-none absolute bottom-8 right-[10%] w-12 h-12 text-purple-400 opacity-70 hidden sm:block" />

          <div className="max-w-4xl mx-auto px-4 text-center relative">

            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 bg-white border-2 border-black rounded-full px-4 py-1.5 mb-7 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="h-2 w-2 rounded-full bg-lime-400 border border-black/20" />
              <span className="text-xs font-black uppercase tracking-wider text-black">Producer feedback platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-950 leading-[1.05] mb-6">
              10 producers just<br />
              <span className="relative inline-block">
                <span className="text-purple-600">roasted your track.</span>
                <Scribble className="pointer-events-none absolute -bottom-3 left-0 right-0 w-full h-6 text-purple-400 opacity-40" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-black/60 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              Submit your track. Genre-matched producers in your niche listen, score, and give you timestamp-specific notes within hours — not vibes, not "sounds good bro", actual feedback.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <CtaButton text="Get feedback on my track" />
              <p className="text-sm text-black/40 font-medium">Free to start · No credit card</p>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 pt-4 border-t-2 border-black/6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-black tabular-nums">{s.value}</p>
                  <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Real review examples ─────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-black relative overflow-hidden">

          {/* Background texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="max-w-5xl mx-auto px-4 relative">
            <div className="text-center mb-14">
              <div className={`${caveat.className} text-lime-400 text-xl mb-3`}>actual feedback from the platform</div>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                This is what your<br />reviews look like
              </h2>
              <p className="text-white/50 mt-4 text-base sm:text-lg font-medium max-w-xl mx-auto">
                Specific. Honest. Timestamped. Three producers, three different takes — that's signal.
              </p>
            </div>

            {/* Review cards — stacked on mobile, slight rotation on desktop */}
            <div className="flex flex-col gap-4 sm:hidden">
              {MOCK_REVIEWS.map((r) => (
                <ReviewCard key={r.handle} review={r} />
              ))}
            </div>

            <div className="hidden sm:grid grid-cols-3 gap-4 lg:gap-6 items-start">
              <div className="mt-6">
                <ReviewCard review={MOCK_REVIEWS[0]} rotateClass="-rotate-1" />
              </div>
              <div>
                <ReviewCard review={MOCK_REVIEWS[1]} />
              </div>
              <div className="mt-10">
                <ReviewCard review={MOCK_REVIEWS[2]} rotateClass="rotate-1" />
              </div>
            </div>

            <div className="text-center mt-14">
              <CtaButton text="I want this on my track" className="!bg-lime-400 !text-black" />
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-[#faf8f5] relative overflow-hidden">

          <Zigzag className="pointer-events-none absolute right-4 top-24 w-8 h-20 text-purple-300 opacity-40 hidden lg:block" />
          <Star className="pointer-events-none absolute left-8 bottom-16 w-10 h-10 text-amber-400 opacity-50 rotate-12 hidden lg:block" />

          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-14">
              <div className={`${caveat.className} text-purple-500 text-xl mb-2`}>no gatekeepers</div>
              <h2 className="text-3xl sm:text-5xl font-black text-black leading-tight">
                Artists helping artists.<br />That's it.
              </h2>
              <p className="text-black/50 mt-4 text-base sm:text-lg font-medium max-w-xl">
                Review other producers' tracks in your genre, earn credits, spend them on your own feedback. The loop runs itself.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {HOW_STEPS.map((step) => (
                <div key={step.num} className="bg-white rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-4xl font-black text-black/8 mb-3 tabular-nums">{step.num}</p>
                  <h3 className="text-base font-black text-black mb-2">{step.title}</h3>
                  <p className="text-sm text-black/55 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>

            {/* Credit model callout */}
            <div className="mt-8 bg-purple-600 rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 mb-1">The credit system</p>
                  <p className="font-black text-xl">Don't want to review? Buy a pack.</p>
                  <p className="text-purple-200 text-sm mt-1">10 credits for $9.95 — never expire. Or go Pro for 30 credits/month + priority queue.</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                    <Check className="h-4 w-4 text-lime-400 flex-shrink-0" />10 credits · $9.95 one-time
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                    <Check className="h-4 w-4 text-lime-400 flex-shrink-0" />Pro · $24.95/mo · 30 credits
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What you actually get ─────────────────────────────────── */}
        <section className="py-16 sm:py-20 bg-white border-y-2 border-black/8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-black text-black">Every review includes</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <BarChart2 className="h-6 w-6" />, title: "Scores", body: "Mix, arrangement, energy, and originality — rated out of 10." },
                { icon: <Clock className="h-6 w-6" />, title: "Timestamps", body: "Reviewers drop notes at exact moments in your track." },
                { icon: <MessageSquare className="h-6 w-6" />, title: "Written feedback", body: "Free-text notes on what's working and what isn't." },
                { icon: <StarIcon className="h-6 w-6" />, title: "Release verdict", body: "Release now, fix first, or needs work — a real call." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border-2 border-black/10 bg-[#faf8f5] p-5">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center text-purple-600 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-black text-black mb-1">{item.title}</h3>
                  <p className="text-sm text-black/50 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Reddit-specific social proof ─────────────────────────── */}
        <section className="py-16 sm:py-20 bg-[#faf8f5]">
          <div className="max-w-3xl mx-auto px-4">
            <div className={`${caveat.className} text-center text-purple-500 text-xl mb-3`}>from the community</div>
            <h2 className="text-3xl sm:text-5xl font-black text-black text-center mb-12">Producers who get it</h2>

            <div className="space-y-4">
              {[
                { quote: "I've posted on r/wearethemusicmakers 4 times asking for feedback. Crickets or 'sounds dope bro'. MixReflect gave me 6 structured reviews in 3 hours that actually told me what was broken.", by: "Electronic producer, Melbourne" },
                { quote: "The timestamp notes were insane. Someone literally said '1:42 — the reverb tail on the snare is bleeding into the next beat, pull it back'. That's not something you get from friends.", by: "Hip-hop beatmaker, Toronto" },
                { quote: "Submitted a track I thought was almost done. Three producers independently flagged the same issue with the low end. I fixed it in 20 minutes and it now sounds like a completely different record.", by: "Indie producer, Berlin" },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-6">
                  <p className="text-base text-black/80 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-xs font-black text-black/40 uppercase tracking-wider">{t.by}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-black relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <Sparkle className="pointer-events-none absolute top-8 left-[8%] w-16 h-16 text-purple-400 opacity-30 rotate-12 hidden sm:block" />
          <Star className="pointer-events-none absolute bottom-10 right-[6%] w-10 h-10 text-lime-400 opacity-40 -rotate-6 hidden sm:block" />

          <div className="max-w-2xl mx-auto px-4 text-center relative">
            <div className={`${caveat.className} text-lime-400 text-2xl mb-4`}>your turn</div>
            <h2 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-6">
              Stop guessing.<br />Get the roast.
            </h2>
            <p className="text-white/50 text-lg font-medium mb-10">
              Submit your track. Genre-matched producers get assigned immediately. Real feedback, usually within 4 hours.
            </p>
            <CtaButton text="Submit my track — it's free" />
            <p className="text-white/30 text-sm mt-5 font-medium">
              Start with 1 free credit · Earn more by reviewing · No card needed
            </p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t-2 border-black/8 py-8">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-black/40">
            <div className="flex items-center gap-2">
              <Logo />
              <span>MixReflect</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
              <a href="mailto:support@mixreflect.com" className="hover:text-black transition-colors">Support</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
