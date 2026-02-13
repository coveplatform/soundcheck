import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Sparkle, Cross, MusicNote, Scribble, Zigzag } from "@/components/landing/doodles";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f7f7f5] text-neutral-950">
      {/* Left side — Auth form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Header */}
        <header className="border-b border-neutral-200 bg-[#f7f7f5]/90 backdrop-blur-sm lg:border-b-0">
          <div className="px-6 sm:px-10">
            <div className="flex items-center h-14">
              <Link href="/" className="flex items-center gap-2 w-fit">
                <Logo />
              </Link>
            </div>
          </div>
        </header>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 sm:py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right side — Marketing promo (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] bg-purple-600 text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        {/* Doodles scattered around */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Sparkle className="absolute top-8 right-12 w-12 h-12 text-white/20" />
          <Cross className="absolute top-32 left-8 w-10 h-10 text-white/15" />
          <MusicNote className="absolute bottom-40 right-16 w-14 h-14 text-white/15" />
          <Scribble className="absolute top-1/2 left-4 w-20 h-16 text-white/10" />
          <Zigzag className="absolute bottom-20 left-12 w-8 h-20 text-white/15" />
          <Sparkle className="absolute bottom-60 right-8 w-8 h-8 text-white/10" />
          <Cross className="absolute top-60 right-32 w-6 h-6 text-white/20" />
          {/* Big gradient blobs */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {/* Big headline */}
          <div className="mb-10">
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
              Get heard.<br />
              Get feedback.<br />
              Get better.
            </h2>
            <p className="mt-4 text-purple-100 text-sm leading-relaxed max-w-sm">
              Join 1,200+ artists giving each other honest, genre-matched feedback. Upload your track, review others, earn credits.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-purple-700/60 rounded-xl p-4">
              <div className="text-2xl xl:text-3xl font-black text-white">2,847</div>
              <div className="text-xs text-purple-100 font-semibold mt-1">Tracks reviewed</div>
            </div>
            <div className="bg-purple-700/60 rounded-xl p-4">
              <div className="text-2xl xl:text-3xl font-black text-white">&lt;4hrs</div>
              <div className="text-xs text-purple-100 font-semibold mt-1">Avg turnaround</div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-purple-700/60 rounded-xl p-5">
            <p className="text-sm leading-relaxed text-white/90 italic">
              &ldquo;4 of 5 reviewers said my intro was too long. Cut it down, and it&apos;s now my best performing release.&rdquo;
            </p>
            <p className="mt-3 text-xs text-purple-100 font-semibold">
              Marcus T. · Electronic Producer
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 pt-6 border-t border-white/10">
          <p className="text-xs text-purple-200 font-semibold">
            No credit card required · Pay as you go
          </p>
        </div>
      </div>
    </div>
  );
}
