import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { posts } from "@/lib/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Drop — MixReflect",
  description:
    "Guides, industry insight and practical advice for independent artists. How to get better feedback, improve faster, and release with confidence.",
};

const categoryColor: Record<string, string> = {
  GUIDE: "text-purple-600",
  INDUSTRY: "text-black",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="bg-[#faf8f5] min-h-screen">

      {/* ── FEATURED ─────────────────────────────────────────────── */}
      <div className="border-b border-black/8">
        <Link href={`/blog/${featured.slug}`} className="group block">

          {/* Big image */}
          <div className="relative w-full overflow-hidden bg-neutral-200" style={{ height: "clamp(260px, 50vw, 560px)" }}>
            {featured.coverImage ? (
              <Image
                src={featured.coverImage}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </div>

          {/* Text below */}
          <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 sm:py-10">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${categoryColor[featured.category] ?? "text-black"}`}>
                {featured.category}
              </span>
              <span className="text-black/20 text-xs">·</span>
              <span className="text-[11px] text-black/40 font-medium">{featured.date}</span>
            </div>
            <h2
              className="font-black text-black tracking-tight leading-[1] group-hover:text-purple-700 transition-colors mb-4"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
            >
              {featured.title}
            </h2>
            <p className="text-black/55 text-base font-medium leading-relaxed max-w-2xl mb-6">
              {featured.excerpt}
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-black text-black group-hover:text-purple-700 transition-colors">
              Read
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>

      {/* ── GRID ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-10 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 gap-10 sm:gap-12">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">

              {/* Image */}
              <div className="relative w-full overflow-hidden bg-neutral-200 rounded-sm mb-5" style={{ aspectRatio: "16/10" }}>
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-100" />
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${categoryColor[post.category] ?? "text-black"}`}>
                  {post.category}
                </span>
                <span className="text-black/20 text-xs">·</span>
                <span className="text-[11px] text-black/40 font-medium">{post.date}</span>
              </div>

              {/* Title */}
              <h3
                className="font-black text-black tracking-tight leading-[1.1] group-hover:text-purple-700 transition-colors mb-3"
                style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)" }}
              >
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-black/50 text-sm font-medium leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>

              <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-black/30 group-hover:text-purple-600 transition-colors">
                {post.readTime}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <div className="border-t border-black/8 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-10 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-2">MixReflect</p>
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight">
              Find out what&apos;s working<br />in your track.
            </h2>
          </div>
          <Link
            href="/signup"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-purple-600 text-white font-black px-8 py-4 text-sm hover:bg-purple-700 transition-colors rounded-xl"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
