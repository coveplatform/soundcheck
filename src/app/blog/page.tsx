import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { posts } from "@/lib/blog-posts";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export const metadata: Metadata = {
  title: "The Drop — MixReflect",
  description:
    "Guides, industry insight and practical advice for independent artists. How to get better feedback, improve faster, and release with confidence.",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = posts;

  return (
    <div
      className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black lowercase`}
    >
      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className={`${mono.className} flex items-center gap-5 text-[13px]`}>
            <Link href="/" className="text-white/55 hover:text-white transition-colors">
              ← back
            </Link>
            <Link
              href="/#pricing"
              className="bg-[#6ee7ff] text-black px-3.5 py-1.5 font-bold transition-colors hover:bg-white"
            >
              get feedback
            </Link>
          </div>
        </div>
      </header>

      {/* masthead */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <p className={`${mono.className} text-[13px] text-white/40 mb-3`}>
            [ the drop ]
          </p>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-[-0.04em]">
            notes from
            <br />
            <span style={{ color: ACCENT }}>the drop</span>.
          </h1>
          <p className="text-white/55 text-lg mt-5 max-w-xl normal-case">
            Guides, industry insight, and straight talk for independent artists —
            how to get better feedback, improve faster, and release with
            confidence.
          </p>
        </div>
      </div>

      {/* featured */}
      <div className="relative z-10 border-b border-white/10">
        <Link href={`/blog/${featured.slug}`} className="group block">
          <div className="max-w-5xl mx-auto px-5 py-12 grid md:grid-cols-2 gap-10 items-center">
            <div className="relative w-full overflow-hidden border border-white/10 bg-white/5" style={{ aspectRatio: "16/10" }}>
              {featured.coverImage && (
                <Image
                  src={featured.coverImage}
                  alt={featured.title}
                  fill
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              )}
            </div>
            <div>
              <div className={`${mono.className} flex items-center gap-2 mb-4 text-[12px]`}>
                <span style={{ color: ACCENT }}>{featured.category.toLowerCase()}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40">{featured.date}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.05] group-hover:text-[#6ee7ff] transition-colors mb-4">
                {featured.title}
              </h2>
              <p className="text-white/55 leading-relaxed normal-case mb-6">
                {featured.excerpt}
              </p>
              <span className={`${mono.className} inline-flex items-center gap-1.5 text-[13px] font-bold`} style={{ color: ACCENT }}>
                read <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-[#0a0a0a] p-5 hover:bg-[#0e0e0e] transition-colors"
            >
              <div className="relative w-full overflow-hidden border border-white/10 bg-white/5 mb-4" style={{ aspectRatio: "16/10" }}>
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className={`${mono.className} flex items-center gap-2 mb-2.5 text-[11px]`}>
                <span style={{ color: ACCENT }}>{post.category.toLowerCase()}</span>
                <span className="text-white/20">·</span>
                <span className="text-white/40">{post.date}</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight leading-[1.15] group-hover:text-[#6ee7ff] transition-colors mb-2">
                {post.title}
              </h3>
              <p className="text-white/50 text-[14px] leading-relaxed normal-case line-clamp-2">
                {post.excerpt}
              </p>
              <span className={`${mono.className} mt-4 inline-flex items-center gap-1 text-[12px] text-white/35 group-hover:text-white transition-colors`}>
                {post.readTime}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* cta */}
      <div className="relative z-10 border-t border-white/10 bg-[#6ee7ff] text-black">
        <div className="max-w-5xl mx-auto px-5 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            find out what&apos;s actually
            <br />
            working in your track.
          </h2>
          <Link
            href="/"
            className="group shrink-0 inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold px-8 py-4 text-sm hover:bg-[#141414] transition-colors"
          >
            get feedback
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
