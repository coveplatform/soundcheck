"use client";

import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Headphones } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

// Reviews + reactions delivered across the platform. The live completed-review
// count sits on top of the historical base so the number keeps ticking up.
const BASE_REVIEWS = 2890;
const TONES = ["#6ee7ff", "#a78bfa", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"];

type Data = { count: number; snippets: { text: string; rating: number }[] };

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5" style={{ background: i < count ? ACCENT : "rgba(255,255,255,0.16)" }} />
      ))}
    </div>
  );
}

export function RealReviews() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/reviews/showcase")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.snippets.length < 3) return null;
  const total = BASE_REVIEWS + data.count;

  return (
    <section className={`${jakarta.className} relative z-10 border-t border-white/10 overflow-hidden`}>
      <div className="absolute -bottom-40 -left-20 w-[34rem] h-[34rem] rounded-full blur-3xl pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT}1a, transparent 70%)` }} />

      <div className="relative max-w-6xl mx-auto px-5 py-20">
        <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-12 lg:gap-14 items-center">
          {/* ── big stat ── */}
          <div>
            <p className={`${mono.className} text-[13px] text-white/55 mb-4`}>[ proof, not promises ]</p>
            <div className="relative inline-block">
              <span
                className="block font-extrabold leading-[0.85] tracking-[-0.04em]"
                style={{ color: ACCENT, fontSize: "clamp(4.5rem, 13vw, 8.5rem)", textShadow: `0 0 60px ${ACCENT}55` }}
              >
                {total.toLocaleString()}
                <span className="text-white">+</span>
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">honest reviews delivered.</p>
            <p className="text-white/55 text-[15px] normal-case mt-4 leading-relaxed max-w-sm">
              Real, unfiltered feedback from the room — every one written by a person who actually
              listened. Here&apos;s a taste, names off.
            </p>

            {/* listener glyphs — honest social proof, no fabricated identities */}
            <div className="flex items-center gap-4 mt-7">
              <div className="flex -space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-10 h-10 flex items-center justify-center border-2 border-[#0a0a0a] bg-[#0f1416]"
                    style={{ boxShadow: `inset 0 0 0 1px ${ACCENT}55, 0 0 18px ${ACCENT}22` }}
                  >
                    <Headphones className="w-4 h-4" style={{ color: ACCENT }} />
                  </span>
                ))}
              </div>
              <p className="text-[16px] sm:text-[18px] font-extrabold tracking-tight leading-none">
                <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}66` }}>thousands</span>
                <span className="text-white"> of real listeners</span>
              </p>
            </div>
          </div>

          {/* ── snippet cards ── */}
          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {data.snippets.map((s, i) => (
              <div key={i} className="bg-[#0a0a0a] p-6 flex flex-col gap-3 relative">
                <span
                  className="absolute top-4 right-5 text-5xl leading-none font-extrabold opacity-10 select-none"
                  style={{ color: ACCENT }}
                  aria-hidden
                >
                  &rdquo;
                </span>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`${mono.className} w-7 h-7 flex items-center justify-center text-[11px] font-bold text-black shrink-0`}
                    style={{ background: TONES[i % TONES.length] }}
                  >
                    {String.fromCharCode(65 + ((i * 5 + 3) % 26))}
                  </span>
                  <Dots count={s.rating} />
                </div>
                <p className="text-[14.5px] leading-relaxed text-white/85 normal-case">{s.text}</p>
                <span className={`${mono.className} mt-auto text-[10px] text-white/35 uppercase tracking-wider`}>
                  verified listener
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
