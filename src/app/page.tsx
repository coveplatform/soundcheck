import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Headphones, Star, DollarSign, Shield, ArrowRight, Target, Clock, ListMusic, Share2, UserPlus, ThumbsUp, Quote, CheckCircle2, Lock } from "lucide-react";
import { ACTIVE_PACKAGE_TYPES, PACKAGES } from "@/lib/metadata";
import { Logo } from "@/components/ui/logo";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { SoundCloudIcon, BandcampIcon, YouTubeIcon } from "@/components/ui/platform-icons";

export default function Home() {
  const pricing = ACTIVE_PACKAGE_TYPES.map((key) => ({ key, ...PACKAGES[key] }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <AuthButtons />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-black bg-gradient-to-br from-white via-lime-50/30 to-white relative overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-lime-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-40" />
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 md:py-28 relative">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-black max-w-4xl leading-[1.1]">
            One opinion is taste.<br />Ten opinions is <span className="text-lime-600">truth</span>.
          </h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-xl leading-relaxed">
            Listened to your track so many times you can&apos;t tell if it&apos;s good anymore?
            Get fresh ears on your music—real feedback from real listeners, delivered in under 12 hours.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/get-feedback">
              <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all active:transition-none">
                Test Your Track <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 font-mono">
            <span>From $4.95 AUD • Results in under 12 hours</span>
          </div>
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

      {/* The Problem */}
      <section className="border-b-2 border-black py-16 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-6">Sound familiar?</h2>
          <div className="space-y-4 text-lg text-neutral-600">
            <p>
              You&apos;ve been working on this track for weeks. You&apos;ve listened to it 200 times.
              You can&apos;t tell if it&apos;s good anymore.
            </p>
            <p>
              You ask your friends. They say <span className="font-bold text-black">&ldquo;yeah it&apos;s really good!&rdquo;</span> They always say that.
            </p>
            <p>
              You post on Reddit. One person says they love it. Another says the mix is trash.
              A third just promotes their own track. You&apos;re back to square one.
            </p>
            <p className="font-bold text-black text-xl pt-4 pl-4 border-l-4 border-lime-500">
              You just want to know: is this ready to release or not?
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Here&apos;s a better way</h2>
          <p className="text-neutral-600 mb-8">Get 10 opinions. See what patterns emerge. Know for sure.</p>

          <div className="space-y-4">
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                1
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Drop your link</p>
                <p className="text-neutral-500 mb-2">
                  Paste a link from any of these platforms. Takes 30 seconds.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                    <SoundCloudIcon className="h-4 w-4 text-[#ff5500]" />
                    <span>SoundCloud</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                    <BandcampIcon className="h-4 w-4 text-[#1da0c3]" />
                    <span>Bandcamp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                    <YouTubeIcon className="h-4 w-4 text-[#ff0000]" />
                    <span>YouTube</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                2
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Real listeners react</p>
                <p className="text-neutral-500">
                  5-20 people who actually like your genre listen to the full track and write detailed feedback.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex-shrink-0 w-14 h-14 bg-lime-500 border-2 border-black text-black font-mono font-black flex items-center justify-center text-xl">
                3
              </span>
              <div className="flex flex-col justify-center">
                <p className="font-bold text-lg">Patterns reveal truth</p>
                <p className="text-neutral-500">
                  When 8/10 say the intro is too long, that&apos;s not taste—that&apos;s consensus. Now you know what to fix.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="border-b-2 border-black py-16 bg-gradient-to-r from-purple-50 via-white to-pink-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-6">This is for you if...</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-8 w-8 bg-lime-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-lg text-neutral-700">You have a track you&apos;re 80% confident in—but not 100%</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-8 w-8 bg-orange-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-lg text-neutral-700">You&apos;re tired of friends who say <span className="font-bold text-black">&ldquo;yeah it&apos;s great!&rdquo;</span></p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-8 w-8 bg-sky-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-lg text-neutral-700">You want real answers before you release, not after</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-8 w-8 bg-purple-400 border-2 border-black flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-lg text-neutral-700">You value your time more than hunting for feedback on Reddit</p>
            </div>
          </div>
          <p className="mt-8 text-neutral-600 p-4 bg-lime-50 border-2 border-lime-200">
            Our reviewers are music lovers who want you to succeed—not critics trying to tear you down.
            <span className="font-bold text-black"> Honest, but on your side.</span>
          </p>
        </div>
      </section>

      {/* Why Paid Works */}
      <section className="border-b-2 border-black py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Why this works when free doesn&apos;t</h2>
          <p className="text-neutral-600 mb-8">The secret: reviewers are accountable to you.</p>

          <div className="border-2 border-black bg-lime-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-xl">The accountability loop</h3>
            </div>
            <div className="space-y-3 text-neutral-700">
              <p>
                <strong>You pay → reviewers earn.</strong> They&apos;re not doing you a favor. This is their job.
              </p>
              <p>
                <strong>You rate every review.</strong> Low ratings = they earn less ($0.50 vs $1.50). High ratings = they get more work.
              </p>
              <p>
                <strong>Result:</strong> They give you the truth—not empty praise. Because their income depends on being genuinely useful to you.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Plus, with 5-10 reviews, one lazy opinion can&apos;t hide. The truth emerges from consensus.
          </p>
        </div>
      </section>

      {/* Example Review */}
      <section className="border-b-2 border-black py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center">
              <Star className="h-6 w-6 text-black" />
            </div>
            <h2 className="text-3xl font-black">Here&apos;s what you get</h2>
          </div>
          <p className="text-neutral-600 mb-10">
            Each review includes scores, signals, and written feedback. You get 5-20 of these.
          </p>

          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Track Header */}
            <div className="p-4 border-b-2 border-black bg-black flex items-center gap-4">
              <div className="h-14 w-14 bg-lime-500 border-2 border-black flex items-center justify-center shrink-0">
                <Music className="h-6 w-6 text-black" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">Midnight Frequency</p>
                <p className="text-neutral-400 text-sm truncate">Electronic • 3:42</p>
              </div>
            </div>

            {/* Reviewer */}
            <div className="p-4 border-b-2 border-black bg-neutral-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-lime-500 border-2 border-black flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <p className="font-bold text-sm">Sarah M.</p>
                  <p className="text-xs text-neutral-500">Electronic • Indie • Alternative</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                <Headphones className="h-4 w-4" />
                <span>Listened 4:32</span>
              </div>
            </div>

            {/* Quick Ratings */}
            <div className="border-b-2 border-black grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-neutral-200">
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">First Impression</p>
                <p className="font-bold text-lime-600">Strong Hook</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Production</p>
                <p className="font-bold">4/5</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Originality</p>
                <p className="font-bold">4/5</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-neutral-500 mb-1">Listen Again?</p>
                <p className="font-bold text-lime-600">Yes</p>
              </div>
            </div>

            {/* Listener Signals */}
            <div className="border-b-2 border-black bg-neutral-50 p-4">
              <p className="text-xs text-neutral-500 mb-3 font-medium">Listener Signals</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-lime-100 border-2 border-lime-500 text-lime-700">
                  <ListMusic className="h-3.5 w-3.5" />
                  Would add to playlist
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-lime-100 border-2 border-lime-500 text-lime-700">
                  <Share2 className="h-3.5 w-3.5" />
                  Would share
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-100 border-2 border-neutral-300 text-neutral-600">
                  <UserPlus className="h-3.5 w-3.5" />
                  Wouldn&apos;t follow yet
                </span>
              </div>
            </div>

            {/* Written Feedback */}
            <div className="p-6 space-y-6">
              {/* The Good */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-lime-500 border border-black flex items-center justify-center text-xs font-bold">+</span>
                  <h4 className="font-bold text-sm">What&apos;s Working</h4>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm pl-8">
                  The synth melody around 0:45 is genuinely catchy—got stuck in my head. The interplay with the drums creates a driving energy that makes you want to move. Low end is tight, punchy kick that cuts through without being muddy. The breakdown at 2:15 was unexpected and added a nice dynamic shift.
                </p>
              </div>

              {/* To Improve */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-orange-400 border border-black flex items-center justify-center text-xs font-bold">→</span>
                  <h4 className="font-bold text-sm">Room to Grow</h4>
                </div>
                <p className="text-neutral-600 leading-relaxed text-sm pl-8">
                  The intro feels long before the hook hits—consider trimming 8-10 seconds. Hi-hats get repetitive in verse 2; some variation or filter sweep would help. The vocal sample at 1:30 sits too loud and clashes with lead synth frequencies.
                </p>
              </div>

              {/* Next Steps */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-sky-400 border border-black flex items-center justify-center text-xs font-bold">!</span>
                  <h4 className="font-bold text-sm">Next Steps</h4>
                </div>
                <ul className="text-neutral-600 text-sm pl-8 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">01</span>
                    <span>Cut the intro by 8-10 seconds to hook listeners faster</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">02</span>
                    <span>Add hi-hat variations or automate a filter in verse 2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 mt-0.5">03</span>
                    <span>EQ the vocal sample to carve space for the lead synth</span>
                  </li>
                </ul>
              </div>

              {/* Similar Artists */}
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">
                  <span className="font-bold text-neutral-700">Sounds like:</span> Bonobo meets Four Tet, with some Tycho influence in the atmospheric pads.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-neutral-100 border-t-2 border-black flex items-center justify-between">
              <span className="text-xs text-neutral-600">1 of 5 reviews</span>
              <span className="text-[10px] font-mono bg-lime-500 border border-black px-2 py-0.5 font-bold">EXAMPLE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b-2 border-black py-16 bg-gradient-to-b from-white to-sky-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-8 text-center">Artists who stopped guessing</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-lime-500 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;I was about to release a track I wasn&apos;t sure about. 4 of 5 reviewers mentioned the intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
              </p>
              <p className="font-bold text-sm">Marcus T.</p>
              <p className="text-xs text-neutral-600">Electronic Producer</p>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-orange-400 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;Finally, feedback I can actually use. Not &apos;sounds good&apos; or random hate—specific timestamps, specific suggestions. Worth every penny.&rdquo;
              </p>
              <p className="font-bold text-sm">Jade K.</p>
              <p className="text-xs text-neutral-600">Singer-Songwriter</p>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-sky-400 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;The consensus thing is real. When 8 people independently say the same thing, you stop arguing with yourself and just fix it.&rdquo;
              </p>
              <p className="font-bold text-sm">Devon R.</p>
              <p className="text-xs text-neutral-600">Hip-Hop Artist</p>
            </div>

            <div className="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              <Quote className="h-8 w-8 text-purple-400 mb-4" />
              <p className="text-neutral-700 mb-4">
                &ldquo;I&apos;ve used this for my last 3 releases. The confidence of knowing it&apos;s actually ready before I put it out is priceless.&rdquo;
              </p>
              <p className="font-bold text-sm">Alex M.</p>
              <p className="text-xs text-neutral-600">Indie Rock</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b-2 border-black py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-2">Why MixReflect?</h2>
          <p className="text-neutral-600 mb-10">
            Built specifically for the pre-release moment when you need to know if it&apos;s ready.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black border-2 border-black">
            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-lime-500 border-2 border-black flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">They work for you</h3>
              <p className="text-sm text-neutral-600">
                You rate every review. Low ratings = they earn less. That&apos;s why they give you real feedback, not empty praise.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-orange-400 border-2 border-black flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">People who get your genre</h3>
              <p className="text-sm text-neutral-600">
                Your trap beat won&apos;t be reviewed by someone who only listens to country. Reviewers pick genres they actually love.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-sky-400 border-2 border-black flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast when you need it</h3>
              <p className="text-sm text-neutral-600">
                All reviews in 24 hours max (usually faster). No waiting weeks for feedback on a track you&apos;re excited about.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-purple-400 border-2 border-black flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Your music stays private</h3>
              <p className="text-sm text-neutral-600">
                Only assigned reviewers hear your track. We never share, publish, or leak your unreleased work.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-pink-400 border-2 border-black flex items-center justify-center mb-4">
                <ThumbsUp className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Truth through consensus</h3>
              <p className="text-sm text-neutral-600">
                If 7/10 say the intro is too long, that&apos;s not taste—it&apos;s truth. Multiple opinions reveal what actually needs fixing.
              </p>
            </div>

            <div className="bg-white p-6 hover:bg-neutral-50 transition-colors">
              <div className="h-12 w-12 bg-emerald-400 border-2 border-black flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-bold text-lg mb-2">Release with confidence</h3>
              <p className="text-sm text-neutral-600">
                Stop second-guessing. When most reviewers say it&apos;s ready, you can hit publish knowing it&apos;s not just you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b-2 border-black py-16 bg-gradient-to-br from-lime-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-2">Simple pricing. Real results.</h2>
            <p className="text-neutral-600">
              More reviews = clearer patterns = more confidence.
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
                    <p className="text-sm text-neutral-500 mt-1">${(p.price / p.reviews / 100).toFixed(2)} per review</p>
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

                  <Link href="/get-feedback">
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

          <p className="text-center text-sm text-neutral-500 mt-8 flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Your payment goes directly to reviewers. Quality enforced by your ratings.</span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Stop wondering.<br />Start knowing.
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Your next release deserves more than a guess. Find out if it&apos;s ready.
          </p>
          <Link href="/get-feedback">
            <Button
              size="lg"
              className="bg-lime-500 text-black hover:bg-lime-400 active:bg-lime-600 font-bold text-base px-10 border-2 border-lime-500"
            >
              Test Your Track
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-10">Questions</h2>
          <div className="space-y-0 border-2 border-black">
            {[
              {
                q: "Why do I need multiple reviews instead of just one?",
                a: "One person's feedback is just their taste. With 5-10 reviews, patterns emerge. If one person says your intro is too long, maybe they're wrong. If 7 out of 10 say it, that's something to fix. Consensus separates taste from truth.",
              },
              {
                q: "If reviewers are paid, won't they just say nice things?",
                a: "The opposite. You rate every review. Low ratings = reviewers earn less ($0.50 vs $1.50/review) and lose access to future work. The incentive is honest, useful feedback—not empty praise. Plus, with 5-10 reviews, one fake positive can't hide when everyone else disagrees.",
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
                a: "That's fine—and expected sometimes. The power is in patterns: if only 1 person mentions something, it might be taste. If 7 do, it's worth considering. You always make the final call.",
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
                <summary className="font-bold cursor-pointer hover:text-neutral-600">
                  {item.q}
                </summary>
                <p className="mt-3 text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* For Reviewers - Compact */}
      <section id="for-reviewers" className="border-b-2 border-black py-12 bg-orange-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-orange-400 border-2 border-black flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-black" />
                </div>
                <h2 className="text-2xl font-black">Want to get paid for reviewing?</h2>
              </div>
              <p className="text-neutral-600">
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
      <footer className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <p className="text-neutral-500">
              &copy; {new Date().getFullYear()} MixReflect
            </p>
            <div className="flex items-center gap-4 text-neutral-600">
              <Link href="/terms" className="hover:text-black font-medium">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-black font-medium">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-black font-medium">
                Support
              </Link>
            </div>
          </div>
          {/* Payment Trust Badge */}
          <div className="mt-6 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Secure payments powered by</span>
              <svg className="h-5 w-auto text-neutral-600" viewBox="0 0 60 25" fill="currentColor">
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95l.3 2.92c-1.25.63-2.84 1.03-4.72 1.03-4.12 0-6.6-2.55-6.6-6.64 0-3.98 2.44-6.86 6.08-6.86 3.76 0 5.86 2.88 5.86 6.64 0 .42-.04.88-.11 1.31zm-5.73-5.2c-1.26 0-2.26.94-2.49 2.67h4.87c-.08-1.53-.86-2.67-2.38-2.67zM36.95 19.52V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zm-7.14 0V8.13l-2.2.49V5.94l5.88-1.32v14.9h-3.68zM15.97 6.33c3.9 0 6.05 2.88 6.05 6.64s-2.15 6.86-6.05 6.86-6.08-2.88-6.08-6.86 2.18-6.64 6.08-6.64zm0 10.46c1.49 0 2.37-1.34 2.37-3.82s-.88-3.6-2.37-3.6-2.4 1.12-2.4 3.6.91 3.82 2.4 3.82zM5.97 19.52c-2.15 0-3.87-1.12-3.87-3.98V9.38H0V6.55h2.1V3.11L5.82 2v4.55h2.79v2.83H5.82v5.72c0 1.08.45 1.46 1.19 1.46.56 0 1.08-.15 1.6-.45l.41 2.76c-.75.37-1.71.65-3.05.65z"/>
              </svg>
            </div>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
