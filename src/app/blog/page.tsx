import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { posts } from "@/lib/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The MixReflect Journal — Music Feedback & Artist Resources",
  description:
    "Guides, industry insight and practical advice for independent artists. How to get better feedback, improve faster, and release with confidence.",
};

const categoryColor: Record<string, string> = {
  GUIDE: "bg-purple-600",
  INDUSTRY: "bg-black",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = posts;

  return (
    <div>
      {/* ── MASTHEAD ─────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <h1
            className="font-black text-white leading-[0.9] tracking-tighter"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
          >
            Resources<br />
            <span className="text-purple-400">for artists.</span>
          </h1>
          <div className="mt-8 h-px bg-white/10 max-w-sm" />
          <p className="mt-6 text-white/50 text-sm font-medium max-w-md leading-relaxed">
            Practical guides on getting better feedback, improving your sound, and releasing with confidence.
          </p>
        </div>
      </div>

      {/* ── FEATURED POST ────────────────────────────────────────── */}
      <div className="border-b-4 border-black">
        <Link href={`/blog/${featured.slug}`} className="group block">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 grid sm:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <span
                className={`inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white px-3 py-1.5 mb-6 ${categoryColor[featured.category] ?? "bg-black"}`}
              >
                {featured.category}
              </span>
              <h2
                className="font-black text-black tracking-tighter leading-[0.95] group-hover:text-purple-700 transition-colors"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                {featured.title}
              </h2>
              <p className="mt-4 text-black/50 text-base font-medium leading-relaxed max-w-2xl">
                {featured.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-black/30">
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-2 border-2 border-black px-6 py-3 font-black text-sm text-black group-hover:bg-black group-hover:text-white transition-colors">
                Read
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── POST GRID ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-8">
          More articles
        </p>
        <div className="grid sm:grid-cols-2 gap-px bg-black border border-black">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-[#faf8f5] p-8 sm:p-10 hover:bg-white transition-colors flex flex-col"
            >
              <span
                className={`self-start text-[10px] font-black uppercase tracking-[0.3em] text-white px-2.5 py-1 mb-6 ${categoryColor[post.category] ?? "bg-black"}`}
              >
                {post.category}
              </span>
              <h3
                className="font-black text-black tracking-tight leading-[1.05] group-hover:text-purple-700 transition-colors flex-1"
                style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)" }}
              >
                {post.title}
              </h3>
              <p className="mt-3 text-black/45 text-sm leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-black/25">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-black/30 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <div className="bg-purple-600 border-t-4 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">
              MixReflect
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Find out what's working<br />in your track.
            </h2>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-colors border-2 border-white"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
