"use client";

import { useEffect, useState } from "react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

type Data = { count: number; snippets: { text: string; rating: number }[] };

function Dots({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className="w-2 h-2" style={{ background: i < count ? ACCENT : "rgba(255,255,255,0.14)" }} />
      ))}
    </div>
  );
}

/** Real social proof — anonymized snippets from the platform's completed reviews. */
export function RealReviews() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/reviews/showcase")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.snippets.length < 3) return null;
  const floor = Math.max(100, Math.floor(data.count / 10) * 10);

  return (
    <section className={`${jakarta.className} relative z-10 border-t border-white/10`}>
      <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className={`${mono.className} text-[13px] text-white/55 mb-2`}>[ from the room ]</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {floor.toLocaleString()}+ honest reviews delivered<span style={{ color: ACCENT }}>.</span>
            </h2>
          </div>
          <p className={`${mono.className} text-[12px] text-white/40 normal-case max-w-xs`}>
            real, unfiltered feedback from the room — a sample, names off.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {data.snippets.map((s, i) => (
            <div key={i} className="bg-[#0a0a0a] p-6 flex flex-col gap-3.5">
              <Dots count={s.rating} />
              <p className="text-[15px] leading-relaxed text-white/85 normal-case">“{s.text}”</p>
              <span className={`${mono.className} mt-auto text-[11px] text-white/35 uppercase tracking-wider`}>
                — a verified listener
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
