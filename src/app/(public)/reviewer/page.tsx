import { getServerSession } from "next-auth";
import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/logo";
import { OptInButton } from "../score-review/opt-in-button";
import { ArrowRight, Headphones, Heart, Zap } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const dynamic = "force-dynamic";

const PERKS = [
  { icon: Headphones, t: "hear it first", d: "fresh tracks land in your queue — be one of the first ears on new music." },
  { icon: Heart, t: "shape the room", d: "your honest reaction goes straight into an artist's report. real impact, real fast." },
  { icon: Zap, t: "two minutes each", d: "listen, leave a rating and a few honest lines. no long forms, no commitment." },
];

export default async function ReviewerLandingPage() {
  const session = await getServerSession(authOptions);

  let isReviewer = false;
  if (session?.user?.id) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isScoreReviewer: true },
    });
    isReviewer = !!me?.isScoreReviewer;
  }

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/score">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/score" className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
            ← back
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-16">
        <p className={`${mono.className} text-[13px] text-white/55 mb-3`}>[ the listening panel ]</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] mb-4">
          review tracks.<br />
          <span style={{ color: ACCENT }}>help artists</span> land.
        </h1>
        <p className="text-white/70 text-lg mb-10 normal-case max-w-md leading-relaxed">
          Artists drop a track and get played for a room of real listeners. Be one of
          them — leave honest, fast reactions and shape what they fix before release.
        </p>

        {/* CTA — state-aware */}
        <div className="mb-12">
          {isReviewer ? (
            <Link
              href="/score-review"
              className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors"
            >
              go to your queue
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : session?.user ? (
            <>
              <OptInButton label="become a reviewer" />
              <p className={`${mono.className} text-[12px] text-white/45 mt-3 normal-case`}>
                one click · start reviewing right away
              </p>
            </>
          ) : (
            <>
              <Link
                href="/login?callbackUrl=/reviewer"
                className="group inline-flex items-center gap-2 bg-[#6ee7ff] text-black font-extrabold text-base px-8 py-4 hover:bg-white transition-colors"
              >
                sign up to review
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className={`${mono.className} text-[12px] text-white/45 mt-3 normal-case`}>
                free · just want to review? you don&apos;t need to submit anything.
              </p>
            </>
          )}
        </div>

        {/* perks */}
        <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {PERKS.map((p) => (
            <div key={p.t} className="bg-[#0a0a0a] p-6">
              <p.icon className="h-5 w-5 mb-3" style={{ color: ACCENT }} />
              <h3 className="text-base font-extrabold mb-1.5">{p.t}</h3>
              <p className="text-white/65 text-[13.5px] leading-relaxed normal-case">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
