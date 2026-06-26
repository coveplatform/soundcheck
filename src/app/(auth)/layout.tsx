import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${jakarta.className} min-h-screen flex flex-col lg:flex-row bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black`}
    >
      {/* Left — auth form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <header className="border-b border-white/10">
          <div className="px-6 sm:px-10">
            <div className="flex items-center h-16">
              <Link href="/" className="w-fit">
                <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 sm:py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* Right — the product pitch (desktop only) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-l border-white/10 bg-[#0c0c0c]">
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(110,231,255,0.12)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(110,231,255,0.06)" }}
        />

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <p className={`${mono.className} text-[12px] tracking-[0.2em] uppercase text-white/45 mb-5`}>
            the release decision
          </p>
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.1]">
            an honest <span style={{ color: ACCENT }}>verdict</span> on your track.
            <br />
            then a room of real listeners.
          </h2>
          <p className="mt-5 text-white/65 text-[15px] leading-relaxed max-w-sm">
            measured straight from your audio, not guessed — is it ready to release, and the one
            thing standing between it and there.
          </p>

          <ul className={`${mono.className} mt-8 space-y-3 text-[13px] text-white/70`}>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0" style={{ background: ACCENT }} /> the release
              verdict + score
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0" style={{ background: ACCENT }} /> 5 real
              listeners on your track
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 shrink-0" style={{ background: ACCENT }} /> first report
              free — no card
            </li>
          </ul>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10">
          <p className={`${mono.className} text-[11px] text-white/40`}>
            first report free · no credit card
          </p>
        </div>
      </div>
    </div>
  );
}
