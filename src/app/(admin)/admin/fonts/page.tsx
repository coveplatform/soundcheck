import {
  Plus_Jakarta_Sans,
  DM_Sans,
  Bricolage_Grotesque,
  Space_Grotesk,
  Outfit,
  Inter,
} from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const fonts = [
  {
    id: "inter",
    name: "Inter",
    tag: "Current",
    tagColor: "bg-neutral-100 text-neutral-500",
    description: "The default. Neutral, widely trusted, extremely readable. Safe but unremarkable.",
    font: inter,
  },
  {
    id: "plus-jakarta",
    name: "Plus Jakarta Sans",
    tag: "Recommended",
    tagColor: "bg-purple-100 text-purple-700",
    description: "A humanist grotesque with slightly more warmth and character than Inter. Very popular on premium SaaS products. Easy drop-in upgrade.",
    font: plusJakarta,
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    tag: "Clean",
    tagColor: "bg-blue-50 text-blue-600",
    description: "Lighter and more open than Inter. Feels approachable and friendly. Body text becomes noticeably easier to read at smaller sizes.",
    font: dmSans,
  },
  {
    id: "bricolage",
    name: "Bricolage Grotesque",
    tag: "Bold personality",
    tagColor: "bg-orange-50 text-orange-600",
    description: "Slightly quirky optical sizing and letterspacing. Has a creative/editorial edge that stands out. Popular with music, art, and creative tech brands.",
    font: bricolage,
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    tag: "Distinctive",
    tagColor: "bg-emerald-50 text-emerald-700",
    description: "Distinctive open apertures and a slightly irregular rhythm. Feels techy-meets-musical. Numbers look particularly strong at large sizes.",
    font: spaceGrotesk,
  },
  {
    id: "outfit",
    name: "Outfit",
    tag: "Geometric",
    tagColor: "bg-pink-50 text-pink-600",
    description: "Clean geometric with excellent weight range. Very strong at display sizes. Feels modern and product-forward without being cold.",
    font: outfit,
  },
];

function MiniTrackCard({ fontClass }: { fontClass: string }) {
  return (
    <div className={`${fontClass} rounded-2xl border border-black/8 bg-white overflow-hidden shadow-sm`}>
      {/* Hero */}
      <div className="bg-neutral-900 px-5 py-5 flex gap-4">
        <div className="w-14 h-14 rounded-xl bg-purple-500/30 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Requesting reviews for</p>
          <h2 className="text-xl font-extrabold text-white leading-tight truncate">Above The Ocean</h2>
          <div className="flex gap-1.5 mt-1.5">
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/40 uppercase tracking-wider">Folk</span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/40 uppercase tracking-wider">Acoustic</span>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-end gap-0 border-b border-black/8 bg-white px-4">
        {["Stats", "Reviews", "Settings"].map((tab, i) => (
          <div key={tab} className={`px-3 py-3 text-[11px] font-semibold ${i === 1 ? "text-black border-b-2 border-purple-600 -mb-px" : "text-black/30"}`}>
            {tab}
          </div>
        ))}
      </div>

      {/* Review card */}
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-black/8 bg-white p-4 shadow-sm">
          {/* Byline */}
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-black/6">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
              M
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-black">Marcus</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 text-black/40">Active Reviewer</span>
              </div>
              <p className="text-xs text-black/30">14 reviews</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">Hooked</span>
          </div>

          {/* Verdict */}
          <div className="flex gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500 text-white">Release Ready</span>
            <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700">↺ Would replay</span>
          </div>

          {/* Feedback */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-black/40 mb-1">What Worked</p>
              <p className="text-sm text-black/70 leading-relaxed">The guitar tone on the intro is genuinely beautiful. It pulls you in immediately and sets a mood that carries through the whole track.</p>
            </div>
            <div className="border-t border-black/6 pt-3">
              <p className="text-xs font-semibold text-black/40 mb-1">Main Feedback</p>
              <p className="text-sm text-black/70 leading-relaxed">The mid-section loses energy around the 2 minute mark — could benefit from a subtle build or dynamic shift to re-engage before the final chorus.</p>
            </div>
          </div>

          {/* Scores */}
          <div className="mt-4 pt-4 border-t border-black/6 flex gap-5">
            {[["Production", "4"], ["Originality", "4"], ["Vocals", "3"]].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] font-medium text-black/35 mb-0.5">{label}</p>
                <p className="text-lg font-black text-black tabular-nums leading-none">{val}<span className="text-xs text-black/30 font-medium ml-0.5">/5</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 rounded-2xl border border-black/8 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-black/6">
            <p className="text-xs font-semibold text-black/40">Scores · 3 reviews</p>
          </div>
          <div className="flex divide-x divide-black/6">
            {[["4.2", "Production"], ["3.8", "Originality"], ["3.3", "Vocals"]].map(([score, label]) => (
              <div key={label} className="flex-1 px-4 py-4 text-center">
                <p className="text-2xl font-black tabular-nums text-black leading-none">{score}</p>
                <p className="text-[10px] font-medium text-black/40 mt-1">{label}</p>
                <p className="text-[10px] font-medium text-purple-600 mt-0.5">Strong</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 flex gap-2">
          <button className="flex-1 h-10 rounded-xl bg-purple-600 text-white text-sm font-semibold">
            Get another round
          </button>
          <button className="h-10 px-4 rounded-xl border border-black/15 text-sm font-medium text-black/60">
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FontsPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-neutral-900 mb-1">Font Exploration</h1>
        <p className="text-sm text-neutral-500">
          Each option below shows how the font looks across the actual track review UI. Current font is Inter.
        </p>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-10 p-4 rounded-2xl border border-neutral-200 bg-white">
        <p className="text-xs font-semibold text-neutral-400 w-full mb-1">Jump to</p>
        {fonts.map((f) => (
          <a
            key={f.id}
            href={`#${f.id}`}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-purple-300 hover:text-purple-700 transition-colors"
          >
            {f.name}
          </a>
        ))}
      </div>

      <div className="space-y-16">
        {fonts.map((f) => (
          <section key={f.id} id={f.id} className="scroll-mt-20">
            {/* Font header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className={`${f.font.className} text-2xl font-extrabold text-neutral-900`}>{f.name}</h2>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${f.tagColor}`}>{f.tag}</span>
              </div>
              <p className="text-sm text-neutral-500 mb-4">{f.description}</p>

              {/* Type specimen */}
              <div className={`${f.font.className} p-5 rounded-2xl border border-neutral-200 bg-neutral-50`}>
                <p className="text-4xl font-extrabold text-neutral-900 leading-tight mb-1">MixReflect</p>
                <p className="text-2xl font-semibold text-neutral-600 mb-1">Release Ready · Above The Ocean</p>
                <p className="text-base font-medium text-neutral-500 mb-1">Get real feedback from real artists in your genre.</p>
                <p className="text-sm text-neutral-400 mb-3">Production 4.2 · Originality 3.8 · Vocals 3.3 · 3 reviews completed</p>
                <div className="flex items-baseline gap-2 text-neutral-300">
                  <span className="text-xs font-medium">ABCDEFGHIJKLMNOPQRSTUVWXYZ</span>
                </div>
                <div className="flex items-baseline gap-2 text-neutral-400">
                  <span className="text-xs font-medium">abcdefghijklmnopqrstuvwxyz  0123456789</span>
                </div>
              </div>
            </div>

            {/* UI demo */}
            <MiniTrackCard fontClass={f.font.className} />
          </section>
        ))}
      </div>

      <div className="mt-16 p-5 rounded-2xl border border-neutral-200 bg-white">
        <p className="text-sm font-semibold text-neutral-700 mb-1">To apply a font globally</p>
        <p className="text-xs text-neutral-500 mb-3">
          Once you pick one, update <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">src/app/layout.tsx</code> — replace the Inter import with the chosen font and update the body className. Takes about 2 minutes.
        </p>
        <pre className="text-xs bg-neutral-950 text-neutral-300 rounded-xl p-4 overflow-x-auto">{`// Example: switching to Plus Jakarta Sans
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// In body className:
<body className={\`\${font.variable} antialiased\`}>`}</pre>
      </div>
    </div>
  );
}
