import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Headphones, Shield, ArrowRight, ArrowLeft, Target, Clock, Quote, CheckCircle2, Lock, Users, MessageCircle, Flame, Music, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";

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
      <section className="border-b border-neutral-800 relative overflow-hidden min-h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="absolute top-20 right-10 w-32 h-32 bg-lime-500 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-400 rounded-full blur-2xl opacity-20" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20 relative flex-1 flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left column - Text & CTA */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Get track feedback from <span className="text-lime-500">artists + listeners</span> in your music community.
              </h1>
              <p className="mt-6 text-neutral-200 text-lg sm:text-xl font-bold leading-snug">
                <span className="text-orange-400">Reviewers earn $0.50–$1.50 per review.</span> You rate every review to keep quality high.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                    Start trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#examples" className="text-sm font-bold text-black bg-white px-3 py-1 border-2 border-black hover:bg-neutral-50 active:bg-neutral-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                  View examples
                </Link>
              </div>
            </div>

            {/* Right column - Track Scorecard Preview */}
            <div className="w-full max-w-lg mx-auto lg:max-w-none relative">
              {/* Stacked cards behind */}
              <div className="absolute inset-0 border-2 border-black bg-neutral-800 transform rotate-3 translate-x-3 translate-y-3 opacity-60" />
              <div className="absolute inset-0 border-2 border-black bg-neutral-850 transform rotate-1 translate-x-1.5 translate-y-1.5 opacity-80" style={{ backgroundColor: '#1a1a1a' }} />

              {/* Main card */}
              <div className="relative border-2 border-black bg-neutral-900 shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
                {/* Track header */}
                <div className="flex items-center gap-3 p-3 sm:p-4 border-b-2 border-neutral-800 bg-black/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm sm:text-base truncate">Midnight Drive</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] sm:text-xs font-bold text-black bg-orange-400 px-1.5 py-0.5">Electronic</span>
                      <span className="text-[10px] sm:text-xs text-neutral-500">by You</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  {/* Reviewers row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {['bg-lime-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'].map((bg, i) => (
                          <div key={i} className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${bg} border-2 border-neutral-900 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-black`}>
                            {['S', 'M', 'J', 'A'][i]}
                          </div>
                        ))}
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white">
                          +16
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-neutral-400 hidden sm:inline">Genre-matched</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-lime-500/20 border border-lime-500/30 px-2 py-1 rounded">
                      <span className="text-base sm:text-lg font-black text-lime-400">20</span>
                      <span className="text-[10px] sm:text-xs font-bold text-lime-400/80">reviews</span>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-black/40 border border-neutral-800 rounded">
                      <div className="text-lg sm:text-xl font-black text-lime-400">85%</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-500">would replay</div>
                    </div>
                    <div className="text-center p-2 bg-black/40 border border-neutral-800 rounded">
                      <div className="text-lg sm:text-xl font-black text-white">60%</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-500">would playlist</div>
                    </div>
                    <div className="text-center p-2 bg-black/40 border border-neutral-800 rounded">
                      <div className="text-lg sm:text-xl font-black text-white">35%</div>
                      <div className="text-[9px] sm:text-[10px] text-neutral-500">would share</div>
                    </div>
                  </div>

                  {/* Consensus Insights - the killer feature */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[10px] font-black text-neutral-500 tracking-wider">WHAT YOUR REVIEWERS AGREED ON</div>
                    <div className="bg-lime-500/10 border border-lime-500/40 p-2.5 sm:p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-black text-lime-400">15 of 20 agreed:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-white">&quot;The hook at <span className="font-mono bg-neutral-800 px-1 rounded">0:45</span> is instantly memorable&quot;</p>
                    </div>
                    <div className="bg-orange-400/10 border border-orange-400/40 p-2.5 sm:p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-black text-orange-400">14 of 20 suggested:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-white">&quot;Cut the intro by 8-10 seconds&quot;</p>
                    </div>
                  </div>

                  {/* Sample review snippet */}
                  <div className="border-t border-neutral-800 pt-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center text-[10px] font-black text-black flex-shrink-0">S</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Sarah</span>
                          <span className="text-[9px] text-neutral-500">Electronic fan</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 line-clamp-2">&quot;The drop at 1:12 hits hard — drums and bass are tight. I&apos;d listen to this again.&quot;</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Bar - pinned to bottom of hero */}
        <div className="w-full bg-black text-white border-t border-neutral-800">
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
        </div>
      </section>

      {/* Your Track Report Section */}
      <section className="mt-0 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-orange-400 text-black border-y-2 border-black py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Your Track Report
          </h2>
          <p className="mt-2 text-base font-medium max-w-xl mx-auto">
            Analytics, consensus insights, and detailed reviews — all in one place
          </p>
        </div>
      </section>

      <section id="examples" className="py-16 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4">

          {/* Dashboard Frame */}
          <div className="bg-neutral-900 border-2 border-black shadow-[8px_8px_0px_0px_rgba(132,204,22,0.4)]">
            {/* Browser Chrome */}
            <div className="bg-black px-4 py-3 border-b-2 border-neutral-800 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
                <div className="w-3 h-3 rounded-full bg-neutral-700" />
              </div>
              <div className="flex-1 bg-neutral-800 rounded px-3 py-1 ml-2">
                <span className="text-xs text-neutral-500 font-mono">mixreflect.com/tracks/midnight-drive/report</span>
              </div>
            </div>

            {/* Track Header with Waveform */}
            <div className="bg-black/80 border-b border-neutral-800 p-4 sm:p-5">
              <div className="flex items-center gap-4">
                {/* Album Art / Play Button */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black flex-shrink-0 group cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                  <Music className="h-6 w-6 sm:h-7 sm:w-7 text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:opacity-0 transition-opacity" />
                </div>

                {/* Track Info + Waveform */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-black text-white text-base sm:text-lg truncate">Midnight Drive</h4>
                      <p className="text-xs sm:text-sm text-neutral-400">by <span className="text-white">You</span> • <span className="text-orange-400 font-bold">Electronic</span></p>
                    </div>
                    {/* 20 Reviews Badge - EMPHASIZED */}
                    <div className="flex-shrink-0 bg-lime-500 border-2 border-black px-3 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <div className="text-xl sm:text-2xl font-black text-black leading-none">20</div>
                      <div className="text-[9px] sm:text-[10px] font-bold text-black/70 uppercase tracking-wide">Reviews</div>
                    </div>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="flex items-end gap-[2px] h-8 sm:h-10">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 50, 75, 95, 60, 85, 70, 55, 80, 45, 70, 90, 65, 50, 75, 85, 60, 45, 70, 55, 80, 65, 90, 75, 50, 85, 70, 55, 80, 60, 45, 75, 65].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-lime-500/60 rounded-sm min-w-[2px]"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-neutral-500 font-mono">0:00</span>
                    <span className="text-[10px] text-neutral-500 font-mono">3:24</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-5 sm:p-8 lg:p-10">

              {/* Analytics Overview - CENTERED */}
              <div className="text-center mb-10">
                <h3 className="text-xl font-black mb-2">Analytics overview</h3>
                <p className="text-sm text-neutral-400 mb-6">See how listeners responded to your track at a glance</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-black/50 border border-neutral-700 p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl font-black text-lime-500">83%</div>
                    <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Would replay</div>
                  </div>
                  <div className="bg-black/50 border border-neutral-700 p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl font-black text-lime-500">67%</div>
                    <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Would playlist</div>
                  </div>
                  <div className="bg-black/50 border border-neutral-700 p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl font-black text-white">52%</div>
                    <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Would share</div>
                  </div>
                  <div className="bg-black/50 border border-neutral-700 p-4 sm:p-5">
                    <div className="text-2xl sm:text-3xl font-black text-white">4.2</div>
                    <div className="text-[10px] sm:text-xs text-neutral-500 mt-1">Avg rating</div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
                <span className="text-[10px] font-black text-neutral-600 tracking-widest">CONSENSUS</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
              </div>

              {/* Consensus Insights - LEFT ALIGNED with colored backgrounds */}
              <div className="mb-10">
                <div className="mb-6">
                  <h3 className="text-xl font-black mb-1">Consensus insights</h3>
                  <p className="text-sm text-neutral-400">When multiple reviewers mention the same thing, you know it matters</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* What&apos;s working - lime tinted */}
                  <div className="bg-lime-500/10 border border-lime-500/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 bg-lime-500" />
                      <span className="text-xs font-black text-lime-500">WHAT&apos;S WORKING</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black bg-lime-500 text-black px-2 py-1 whitespace-nowrap">15 of 20</span>
                        <div>
                          <div className="font-bold text-sm">Hook hits hard at 0:45</div>
                          <div className="text-xs text-neutral-500">Melody lands, drums feel confident</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black bg-lime-500/70 text-black px-2 py-1 whitespace-nowrap">12 of 20</span>
                        <div>
                          <div className="font-bold text-sm">Breakdown feels fresh at 2:15</div>
                          <div className="text-xs text-neutral-500">Nice contrast, keeps attention</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* What to improve - orange tinted */}
                  <div className="bg-orange-400/10 border border-orange-400/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-2 w-2 bg-orange-400" />
                      <span className="text-xs font-black text-orange-400">WHAT TO IMPROVE</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black bg-orange-400 text-black px-2 py-1 whitespace-nowrap">14 of 20</span>
                        <div>
                          <div className="font-bold text-sm">Intro too long</div>
                          <div className="text-xs text-neutral-500">Hook should arrive sooner</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-black bg-orange-400/70 text-black px-2 py-1 whitespace-nowrap">10 of 20</span>
                        <div>
                          <div className="font-bold text-sm">Vocal too loud at 1:30</div>
                          <div className="text-xs text-neutral-500">Clashes with the lead synth</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
                <span className="text-[10px] font-black text-neutral-600 tracking-widest">INDIVIDUAL FEEDBACK</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
              </div>

              {/* Individual Reviews - with Navigation */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
                  <div className="order-1 sm:order-2 sm:text-right">
                    <h3 className="text-xl font-black mb-1">Individual reviews</h3>
                    <p className="text-sm text-neutral-400">Structured feedback you can actually use</p>
                  </div>
                </div>

                {/* Review Card with Navigation Arrows */}
                <div className="flex items-stretch gap-3">
                  {/* Left Arrow */}
                  <button className="hidden sm:flex items-center justify-center w-10 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer group">
                    <ChevronLeft className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
                  </button>

                  {/* Review Card */}
                  <div className="flex-1 bg-black/50 border border-neutral-700 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-lime-500 flex items-center justify-center font-black text-black">S</div>
                        <div>
                          <div className="font-black">Sarah</div>
                          <div className="text-xs text-neutral-500">Electronic • 4.2/5 rating</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would replay</span>
                        <span className="text-xs font-black bg-lime-500/20 text-lime-400 px-2 py-1">Would playlist</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <div className="text-xs font-black text-lime-500 mb-2">WHAT WORKED</div>
                        <p className="text-neutral-300 text-sm leading-relaxed">
                          The hook at <span className="font-mono text-white bg-neutral-800 px-1 rounded text-xs">0:45</span> is instantly memorable — I caught myself humming it after. The drop at <span className="font-mono text-white bg-neutral-800 px-1 rounded text-xs">1:12</span> hits hard...
                        </p>
                      </div>
                      <div>
                        <div className="text-xs font-black text-orange-400 mb-2">TO IMPROVE</div>
                        <p className="text-neutral-300 text-sm leading-relaxed">
                          Intro feels too long — I&apos;d cut 8-12 seconds to get to the action faster. Around <span className="font-mono text-white bg-neutral-800 px-1 rounded text-xs">1:30</span> the vocal sits on top of...
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-700 flex items-center justify-between">
                      {/* Pagination Dots */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-lime-500" />
                          <div className="w-2 h-2 rounded-full bg-neutral-700" />
                          <div className="w-2 h-2 rounded-full bg-neutral-700" />
                          <div className="w-2 h-2 rounded-full bg-neutral-700" />
                          <div className="w-2 h-2 rounded-full bg-neutral-700" />
                          <span className="text-[10px] text-neutral-600 ml-1">+15</span>
                        </div>
                        <span className="text-xs font-bold text-neutral-500">1 of 20</span>
                      </div>
                      <span className="text-xs font-bold text-lime-500 flex items-center gap-1 cursor-pointer hover:text-lime-400">
                        Read full review <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <button className="hidden sm:flex items-center justify-center w-10 bg-lime-500 border-2 border-black hover:bg-lime-400 transition-colors cursor-pointer group">
                    <ChevronRight className="h-5 w-5 text-black" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex sm:hidden items-center justify-center gap-4 mt-4">
                  <button className="flex items-center justify-center w-10 h-10 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-colors">
                    <ChevronLeft className="h-5 w-5 text-neutral-400" />
                  </button>
                  <span className="text-sm font-bold text-neutral-400">1 of 20</span>
                  <button className="flex items-center justify-center w-10 h-10 bg-lime-500 border-2 border-black hover:bg-lime-400 transition-colors">
                    <ChevronRight className="h-5 w-5 text-black" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Get your Track Report <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b-2 border-black py-16 bg-lime-500 text-black overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-12 text-center">How it works</h2>

          {/* Desktop: Horizontal flow with arrows */}
          <div className="hidden lg:flex items-center justify-center gap-0">
            {[
              { num: "1", title: "Submit", icon: Music },
              { num: "2", title: "Match", icon: Users },
              { num: "3", title: "Review", icon: MessageCircle },
              { num: "4", title: "Clarity", icon: Flame },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 border-3 border-black bg-black text-lime-500 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                    <step.icon className="h-9 w-9" />
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-xs font-black text-black/60">STEP {step.num}</div>
                    <div className="text-xl font-black">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mx-6 flex items-center">
                    <div className="w-12 h-1 bg-black/30" />
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-black/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: Vertical flow with arrows */}
          <div className="lg:hidden flex flex-col items-center gap-0">
            {[
              { num: "1", title: "Submit", icon: Music },
              { num: "2", title: "Match", icon: Users },
              { num: "3", title: "Review", icon: MessageCircle },
              { num: "4", title: "Clarity", icon: Flame },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 border-2 border-black bg-black text-lime-500 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-black/60">STEP {step.num}</div>
                    <div className="text-xl font-black">{step.title}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="my-4 flex flex-col items-center">
                    <div className="w-1 h-6 bg-black/30" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-black/30" />
                  </div>
                )}
              </div>
            ))}
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
              <Quote className="h-8 w-8 text-lime-500 mb-4" />
              <p className="text-neutral-200 mb-4">
                &ldquo;The consensus thing is real. When 8 people independently say the same thing, you stop arguing with yourself and just fix it.&rdquo;
              </p>
              <p className="font-bold text-sm">Devon R.</p>
              <p className="text-xs text-neutral-300">Hip-Hop Artist</p>
            </div>

            <div className="border-2 border-black p-6 bg-black/80 backdrop-blur text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-orange-400 mb-4" />
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
      <section className="border-y-2 border-black py-16 bg-orange-400 text-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-14 w-14 bg-black border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Target className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Genre-matched</h3>
              <p className="text-sm text-black/70">
                Your trap beat won&apos;t be reviewed by someone who only listens to country.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-black border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Clock className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast turnaround</h3>
              <p className="text-sm text-black/70">
                All reviews delivered within 24 hours. Usually much faster.
              </p>
            </div>

            <div className="text-center">
              <div className="h-14 w-14 bg-black border-2 border-black flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Private & secure</h3>
              <p className="text-sm text-black/70">
                Only assigned reviewers hear your track. We never share or leak your work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b border-neutral-800 py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Simple pricing. Real results.</h2>
            <p className="text-neutral-300 mb-2">
              More reviews = clearer patterns = more confidence.
            </p>
            <p className="text-sm text-neutral-400">
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
                  className={`relative border-2 border-black bg-white p-8 text-black ${
                    isPopular
                      ? "shadow-[8px_8px_0px_0px_rgba(132,204,22,1)] md:-translate-y-2"
                      : "shadow-[6px_6px_0px_0px_rgba(64,64,64,1)]"
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

        </div>
      </section>

      {/* CTA */}
      <section className="bg-lime-500 text-black py-20 border-y-2 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-black/70 mb-10 text-lg">
            Your track deserves more than a guess. Get real feedback from real listeners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-orange-400 text-black hover:bg-orange-300 active:bg-orange-500 font-bold text-base px-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none"
              >
                Get Feedback <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm font-bold text-black bg-orange-400 px-3 py-1 border-2 border-black">First one&apos;s free</span>
          </div>
          <p className="mt-6 text-sm text-black/60">
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
              <span className="font-bold text-neutral-300 tracking-tight">Stripe</span>
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
