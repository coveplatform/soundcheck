import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, ArrowRight, Target, Clock, ListMusic, Share2, UserPlus, Quote, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { SoundCloudIcon, BandcampIcon, YouTubeIcon } from "@/components/ui/platform-icons";

export default function Home() {
  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <AuthButtons theme="dark" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-neutral-800 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-lime-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-400 rounded-full blur-2xl opacity-20" />
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 md:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.1]">
            Real feedback.<br /><span className="text-lime-500">Real fast.</span>
          </h1>
          <p className="mt-6 text-xl text-neutral-300 max-w-2xl leading-relaxed">
            Get 5–20 structured reviews from genre-matched listeners—so you know what to fix before you release.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black">From $4.95 AUD</span>
            <span className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black">Typically &lt;12h</span>
            <span className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black">Human reviewers</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#example" className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black hover:bg-neutral-50">
              View example
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-400 font-mono">
            One-time payment • No subscription
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-b-2 border-black bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-700">
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">500+</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">Reviews Delivered</p>
            </div>
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">&lt;12h</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">Avg Turnaround</p>
            </div>
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">180+</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">Avg Words/Review</p>
            </div>
            <div className="p-4 md:p-6 text-center">
              <p className="text-2xl md:text-3xl font-black text-lime-400">100%</p>
              <p className="text-xs md:text-sm text-neutral-400 mt-1">Human Reviewers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Guarantee Flow */}
      <section className="border-b border-neutral-800 py-12 bg-lime-500 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-2 text-black">The accountability loop</h2>
          <p className="text-black/80 text-center mb-10 max-w-lg mx-auto text-sm sm:text-base">
            Reviewers earn based on your ratings—so they give you real feedback, not empty praise.
          </p>

          {/* 4-column grid on desktop, 2x2 on tablet, stacked on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="flex flex-col items-center p-4 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center mb-3">
                <DollarSign className="h-6 w-6" />
              </div>
              <span className="font-black text-lg">You pay</span>
              <span className="text-xs text-neutral-200">One-time fee</span>
            </div>

            <div className="flex flex-col items-center p-4 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center mb-3">
                <Headphones className="h-6 w-6" />
              </div>
              <span className="font-black text-lg">They review</span>
              <span className="text-xs text-neutral-200">Detailed feedback</span>
            </div>

            <div className="flex flex-col items-center p-4 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-12 w-12 bg-sky-400 border-2 border-black flex items-center justify-center mb-3">
                <Star className="h-6 w-6" />
              </div>
              <span className="font-black text-lg">You rate</span>
              <span className="text-xs text-neutral-200">1-5 stars</span>
            </div>

            <div className="flex flex-col items-center p-4 bg-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(132,204,22,1)]">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <span className="font-black text-lg text-white">Quality</span>
              <span className="text-xs text-lime-400">Enforced</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-b border-neutral-800 py-16 bg-orange-400 text-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-6">Sound familiar?</h2>
          <div className="grid gap-3 text-lg text-black/80">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black mt-1" />
              <p>You&apos;ve listened to your track so many times you can&apos;t hear it objectively anymore.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black mt-1" />
              <p>Friends say “it&apos;s good” (but you still don&apos;t know what to change).</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black mt-1" />
              <p>Online feedback is inconsistent—praise, hate, and spam in the same thread.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-black mt-1" />
              <p className="font-bold text-black">You want signal—not noise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b border-neutral-800 py-16 bg-sky-400 text-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">A better way to improve a track</h2>
          <p className="text-black/80 mb-8">Fast, structured feedback—so you can ship with confidence.</p>

          <div className="space-y-4">
            <div className="flex gap-4 p-5 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                1
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Drop your link</p>
                <p className="text-neutral-200 mb-3">Paste a SoundCloud / Bandcamp / YouTube link. Takes ~30 seconds.</p>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50" title="SoundCloud">
                    <SoundCloudIcon className="h-5 w-5 text-[#ff5500]" />
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50" title="Bandcamp">
                    <BandcampIcon className="h-5 w-5 text-[#1da0c3]" />
                  </div>
                  <div className="p-2 rounded-lg bg-red-50" title="YouTube">
                    <YouTubeIcon className="h-5 w-5 text-[#ff0000]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                2
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Paid reviewers listen</p>
                <p className="text-neutral-200">Genre-matched listeners write structured feedback. Artists rate quality.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-black/80 backdrop-blur text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                3
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Patterns reveal truth</p>
                <p className="text-neutral-200">When multiple people say the same thing, you know what to fix next.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Product Screenshots - Pattern Analytics */}
      <section className="border-b border-neutral-800 py-16 bg-black">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-2">See the patterns. Know what to fix.</h2>
            <p className="text-neutral-300">
              Multiple reviews reveal what&apos;s actually working—and what isn&apos;t.
            </p>
          </div>

          {/* Analytics Preview - This would ideally be a real screenshot */}
          <div className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white p-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span className="font-bold">Pattern Analytics</span>
              <span className="text-sm text-neutral-400 ml-2">from 12 reviews</span>
            </div>

            {/* Scores Row */}
            <div className="p-6 border-b border-neutral-200">
              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-black text-lime-600">4.2</div>
                  <div className="text-sm font-bold text-neutral-600 mt-1">Production</div>
                  <div className="text-xs text-lime-600">↑ Strong</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black">3.8</div>
                  <div className="text-sm font-bold text-neutral-600 mt-1">Originality</div>
                  <div className="text-xs text-neutral-500">→ Solid</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-lime-600">4.5</div>
                  <div className="text-sm font-bold text-neutral-600 mt-1">Vocals</div>
                  <div className="text-xs text-lime-600">↑ Strong</div>
                </div>
              </div>
            </div>

            {/* First Impressions */}
            <div className="p-6 border-b border-neutral-200">
              <div className="text-sm font-bold text-neutral-700 mb-3">First Impressions</div>
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-neutral-100 max-w-lg">
                <div className="h-full bg-lime-500" style={{ width: '67%' }} />
                <div className="h-full bg-amber-400" style={{ width: '25%' }} />
                <div className="h-full bg-neutral-300" style={{ width: '8%' }} />
              </div>
              <div className="flex gap-6 mt-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-lime-500" />Strong Hook 67%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Decent 25%</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />Lost Interest 8%</span>
              </div>
            </div>

            {/* Listener Engagement */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-neutral-700">Listener Engagement</div>
                <span className="text-sm font-black px-2 py-0.5 rounded bg-lime-100 text-lime-700">72%</span>
              </div>
              <div className="space-y-2 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Would listen again</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-500 rounded-full" style={{ width: '83%' }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">83%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Would add to playlist</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-500 rounded-full" style={{ width: '67%' }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">67%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Would share with friends</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-500 rounded-full" style={{ width: '50%' }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">50%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-neutral-400 mt-6">
            When most reviewers agree on something, that&apos;s not taste—that&apos;s signal.
          </p>
        </div>
      </section>

      {/* Example Review */}
      <section className="border-b border-neutral-800 py-16 bg-black">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
              <Star className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-3xl font-black text-white">Here&apos;s what you get</h2>
          </div>
          <p className="text-neutral-300 mb-10">
            Each review includes scores, signals, and written feedback. You get 5-20 of these.
          </p>

          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Review Content - Matches ReviewDisplay component */}
            <article className="p-6">
              {/* Header: Avatar + Name + First Impression + Date */}
              <header className="mb-5">
                <div className="flex items-center gap-3">
                  {/* Rounded avatar with initial */}
                  <span className="h-10 w-10 min-w-[2.5rem] aspect-square flex-shrink-0 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 border-2 border-black overflow-hidden flex items-center justify-center text-sm font-black text-black">
                    S
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-black">Sarah</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lime-100 text-lime-700">
                        Strong Hook
                      </span>
                    </div>
                    <time className="text-xs text-neutral-500">Jan 8, 2026</time>
                  </div>
                </div>
              </header>

              {/* Scores - Inline format */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 mb-5">
                <span>Production <strong className="text-black">4/5</strong></span>
                <span>Vocals <strong className="text-black">5/5</strong></span>
                <span>Originality <strong className="text-black">4/5</strong></span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-lime-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  <strong className="text-lime-600">Would listen again</strong>
                </span>
              </div>

              {/* Listener Signals - Exact badge styling */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 bg-lime-50 border-lime-500 text-lime-700">
                  <ListMusic className="h-3 w-3" />
                  Would playlist
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 bg-lime-50 border-lime-500 text-lime-700">
                  <Share2 className="h-3 w-3" />
                  Would share
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold border-2 bg-neutral-50 border-neutral-300 text-neutral-500">
                  <UserPlus className="h-3 w-3" />
                  No follow
                </span>
              </div>

              {/* Main Feedback - Colored left-border sections with uppercase labels */}
              <div className="space-y-4 mb-5">
                {/* What Worked */}
                <div>
                  <h4 className="text-xs font-bold text-lime-700 uppercase tracking-wide mb-1.5">
                    What Worked
                  </h4>
                  <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-lime-500">
                    The synth melody around 0:45 is genuinely catchy—got stuck in my head. The interplay with the drums creates a driving energy that makes you want to move. Low end is tight, punchy kick that cuts through without being muddy. The breakdown at 2:15 was unexpected and added a nice dynamic shift.
                  </p>
                </div>

                {/* To Improve */}
                <div>
                  <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1.5">
                    To Improve
                  </h4>
                  <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-red-400">
                    The intro feels long before the hook hits—consider trimming 8-10 seconds. Hi-hats get repetitive in verse 2; some variation or filter sweep would help. The vocal sample at 1:30 sits too loud and clashes with lead synth frequencies.
                  </p>
                </div>

                {/* Next Actions */}
                <div>
                  <h4 className="text-xs font-bold text-black uppercase tracking-wide mb-1.5">
                    Next Actions
                  </h4>
                  <p className="text-sm text-neutral-800 leading-relaxed pl-3 border-l-4 border-black whitespace-pre-wrap">1. Cut the intro by 8-10 seconds to hook listeners faster{"\n"}2. Add hi-hat variations or automate a filter in verse 2{"\n"}3. EQ the vocal sample to carve space for the lead synth</p>
                </div>

                {/* Timestamps */}
                <div>
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">
                    Timestamps
                  </h4>
                  <div className="space-y-2">
                    <div className="pl-3 border-l-4 border-purple-400">
                      <p className="text-xs font-mono text-neutral-600">0:45</p>
                      <p className="text-sm text-neutral-800 leading-relaxed">This synth hook is the strongest moment in the track</p>
                    </div>
                    <div className="pl-3 border-l-4 border-purple-400">
                      <p className="text-xs font-mono text-neutral-600">1:30</p>
                      <p className="text-sm text-neutral-800 leading-relaxed">Vocal sample clashes with lead synth here</p>
                    </div>
                    <div className="pl-3 border-l-4 border-purple-400">
                      <p className="text-xs font-mono text-neutral-600">2:15</p>
                      <p className="text-sm text-neutral-800 leading-relaxed">Love this breakdown—great dynamic contrast</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar artists - inline text format */}
              <div className="text-xs text-neutral-500 mb-4">
                <span>Sounds like <strong className="text-neutral-700">Electronic / Downtempo</strong></span>
                <span className="mx-2">·</span>
                <span>Similar to <strong className="text-neutral-700">Bonobo, Four Tet, Tycho</strong></span>
              </div>
            </article>

            {/* Footer */}
            <div className="p-3 bg-neutral-100 border-t-2 border-black flex items-center justify-between">
              <span className="text-xs text-neutral-600">1 of 5 reviews</span>
              <span className="text-[10px] font-mono bg-lime-500 border border-black px-2 py-0.5 font-bold">EXAMPLE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-neutral-800 py-16 bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-8 text-center text-white">Artists who stopped guessing</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-lime-500 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;I was about to release a track I wasn&apos;t sure about. 4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
              </p>
              <p className="font-bold text-sm">Marcus T.</p>
              <p className="text-xs text-neutral-300">Electronic Producer</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-orange-400 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;Finally, feedback I can actually use. Not &apos;sounds good&apos; or random hate—specific timestamps, specific suggestions. Worth every penny.&rdquo;
              </p>
              <p className="font-bold text-sm">Jade K.</p>
              <p className="text-xs text-neutral-300">Singer-Songwriter</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-sky-400 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;The consensus thing is real. When 8 people independently say the same thing, you stop arguing with yourself and just fix it.&rdquo;
              </p>
              <p className="font-bold text-sm">Devon R.</p>
              <p className="text-xs text-neutral-300">Hip-Hop Artist</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-purple-400 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;I&apos;ve used this for my last 3 releases. The confidence of knowing it&apos;s actually ready before I put it out is priceless.&rdquo;
              </p>
              <p className="font-bold text-sm">Alex M.</p>
              <p className="text-xs text-neutral-300">Indie Rock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Compact 3-column */}
      <section className="border-b border-neutral-800 py-16 bg-lime-500 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 bg-orange-400 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Target className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Genre-matched</h3>
              <p className="text-sm text-black/80">
                Your trap beat won&apos;t be reviewed by someone who only listens to country.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-sky-400 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Clock className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast turnaround</h3>
              <p className="text-sm text-black/80">
                All reviews delivered within 24 hours. Usually much faster.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-purple-400 border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-7 w-7 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Private & secure</h3>
              <p className="text-sm text-black/80">
                Only assigned reviewers hear your track. We never share or leak your work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-neutral-800 py-16 bg-sky-400 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Simple pricing. Real results.</h2>
            <p className="text-black/80 mb-2">
              More reviews = clearer patterns = more confidence.
            </p>
            <p className="text-sm text-black/70">
              First review free, no card required
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pricing.map((p) => {
              const price = (p.price / 100).toFixed(2);
              const isPopular = p.key === "STANDARD";

              return (
                <div
                  key={p.key}
                  className={`relative border-2 border-black bg-white p-8 ${
                    isPopular
                      ? "shadow-[8px_8px_0px_0px_rgba(132,204,22,1)] md:-translate-y-2"
                      : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-6 text-xs font-bold bg-lime-500 text-black px-3 py-1 border-2 border-black">
                      RECOMMENDED
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{p.name}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{p.description}</p>
                    </div>
                    <div className={`h-12 w-12 ${isPopular ? 'bg-lime-500' : 'bg-neutral-100'} border-2 border-black flex items-center justify-center font-black text-lg`}>
                      {p.reviews}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-5xl font-black">${price}<span className="text-lg font-bold text-neutral-400 ml-1">AUD</span></div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {p.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "text-orange-500"
                            : "text-lime-600"
                        }`} />
                        <span className={`text-sm ${
                          feature.includes("Consensus") || feature.includes("Pattern")
                            ? "font-semibold"
                            : ""
                        }`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/signup">
                    <Button className={`w-full border-2 border-black font-bold py-6 text-base ${
                      isPopular
                        ? "bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600"
                        : "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900"
                    }`}>
                      Get {p.reviews} Reviews
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-black/70 mt-8 flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Your payment goes directly to reviewers. Quality enforced by your ratings.</span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Your track deserves more than a guess. Get real feedback from real listeners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-lime-500"
              >
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-bold text-black bg-lime-400 px-3 py-1">First one&apos;s free</span>
          </div>
          <p className="mt-6 text-sm text-neutral-500">
            No card required • Results in under 12 hours
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-neutral-800 bg-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-10 text-white">Questions</h2>
          <div className="space-y-0 border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(251,146,60,1)]">
            {[
              {
                q: "Why do I need multiple reviews instead of just one?",
                a: "One person's feedback is just their taste. With multiple reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If most reviewers say it, that's something to fix. Consensus separates taste from truth.",
              },
              {
                q: "If reviewers are paid, won't they just say nice things?",
                a: "The opposite. You rate every review. Low ratings = reviewers earn less ($0.50 vs $1.50/review) and lose access to future work. The incentive is honest, useful feedback—not empty praise. Plus, with multiple reviews, one fake positive can't hide when everyone else disagrees.",
              },
              {
                q: "Who are these reviewers?",
                a: "Real people who passed a quality screening and selected genres they genuinely love. They're rated by artists after every review, so quality matters.",
              },
              {
                q: "Is my unreleased music safe?",
                a: "Yes. Only assigned reviewers hear your track. We never share, publish, or leak anything. Your music stays private.",
              },
              {
                q: "How fast do I get results?",
                a: "All reviews within 24 hours, usually faster. No waiting weeks.",
              },
              {
                q: "What if I disagree with the feedback?",
                a: "That's fine—and expected sometimes. The power is in patterns: if only 1 person mentions something, it might be taste. If multiple reviewers mention it, it's worth considering. You always make the final call.",
              },
              {
                q: "Can I get a refund?",
                a: "If reviews haven't started, yes. Contact support.",
              },
            ].map((item, i, arr) => (
              <details
                key={item.q}
                className={`p-4 ${i < arr.length - 1 ? "border-b-2 border-black" : ""}`}
              >
                <summary className="font-black cursor-pointer hover:text-neutral-300 text-white">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-300">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* For Reviewers - Compact */}
      <section id="for-reviewers" className="border-b border-neutral-800 py-12 bg-orange-400 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-2xl font-black">Want to get paid for reviewing?</h2>
              </div>
              <p className="text-black/80">
                Earn $0.50–$1.50 per review. Artists rate your feedback—high ratings unlock PRO tier (3x pay).
              </p>
            </div>
            <Link href="/signup" className="shrink-0">
              <Button className="bg-orange-400 text-black hover:bg-orange-300 active:bg-orange-500 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Become a Reviewer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black text-white border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo className="text-white" />
            </div>
            <p className="text-neutral-400">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
            <div className="flex items-center gap-4 text-neutral-300">
              <Link href="/terms" className="hover:text-white font-medium">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white font-medium">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-white font-medium">
                Support
              </Link>
            </div>
          </div>
          {/* Payment Trust Badge */}
          <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <svg className="h-5 w-auto text-neutral-300" viewBox="0 0 60 25" fill="currentColor">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95l.3 2.92c-1.25.63-2.84 1.03-4.72 1.03-4.12 0-6.6-2.55-6.6-6.64 0-3.98 2.44-6.86 6.08-6.86 3.76 0 5.86 2.88 5.86 6.64 0 .42-.04.88-.11 1.31zm-5.73-5.2c-1.26 0-2.26.94-2.49 2.67h4.87c-.08-1.53-.86-2.67-2.38-2.67zM36.95 19.52V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zm-7.14 0V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zM15.97 6.33c3.9 0 6.05 2.88 6.05 6.64s-2.15 6.86-6.05 6.86-6.08-2.88-6.08-6.86 2.18-6.64 6.08-6.64zm0 10.46c1.49 0 2.37-1.34 2.37-3.82s-.88-3.6-2.37-3.6-2.4 1.12-2.4 3.6.91 3.82 2.4 3.82zM5.97 19.52c-2.15 0-3.87-1.12-3.87-3.98V9.38H0V6.55h2.1V3.11L5.82 2v4.55h2.79v2.83H5.82v5.72c0 1.08.45 1.46 1.19 1.46.56 0 1.08-.15 1.6-.45l.41 2.76c-.75.37-1.71.65-3.05.65z"/>
              </svg>
            </div>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-lime-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              <span>SSL encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
