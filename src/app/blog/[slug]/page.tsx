import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import { posts, getPost } from "@/lib/blog-posts";
import type { Metadata } from "next";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — The Drop`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : [{ url: "/og-image.png", width: 1200, height: 630, alt: "MixReflect" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : ["/og-image.png"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const faqItems = post.content
    .filter((b) => b.type === "faq")
    .flatMap((b) => (b as { type: "faq"; items: { q: string; a: string }[] }).items);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "MixReflect", url: "https://mixreflect.com" },
    publisher: {
      "@type": "Organization",
      name: "MixReflect",
      url: "https://mixreflect.com",
      logo: { "@type": "ImageObject", url: "https://mixreflect.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://mixreflect.com/blog/${post.slug}` },
    ...(post.coverImage && { image: `https://mixreflect.com${post.coverImage}` }),
  };

  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black`}>
      {/* grain */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0 mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* ── NAV (matches the score product) ──────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <div className={`${mono.className} flex items-center gap-5 text-[13px] lowercase`}>
            <Link href="/blog" className="text-white/55 hover:text-white transition-colors">
              ← the drop
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative z-10 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition-colors mb-10"
          >
            <ArrowLeft className="h-3 w-3" />
            The Drop
          </Link>

          <div className="mb-6">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-black bg-[#6ee7ff] px-3 py-1.5">
              {post.category}
            </span>
          </div>

          <h1
            className="font-black text-white tracking-tighter leading-[0.93]"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)" }}
          >
            {post.title}
          </h1>

          <div className="mt-8 flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-white/25">
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* ── COVER IMAGE ──────────────────────────────────────────── */}
      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-[480px] overflow-hidden bg-neutral-200">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div className="relative z-10 bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          {post.content.map((block, i) => {
            if (block.type === "paragraph") {
              return (
                <p
                  key={i}
                  className="text-[1.0625rem] text-white/70 leading-[1.8] mb-6"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mt-14 mb-5"
                >
                  {block.text}
                </h2>
              );
            }

            if (block.type === "quote") {
              return (
                <div key={i} className="my-10 -mx-4 sm:-mx-8">
                  <div className="bg-[#101010] px-8 sm:px-12 py-10 border-l-4" style={{ borderColor: ACCENT }}>
                    <p
                      className="font-extrabold text-white leading-tight tracking-tight"
                      style={{ fontSize: "clamp(1.3rem, 3vw, 1.75rem)" }}
                    >
                      &ldquo;{block.text}&rdquo;
                    </p>
                  </div>
                </div>
              );
            }

            if (block.type === "list") {
              return (
                <ul key={i} className="mb-6 space-y-3">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                      <span className="text-[1.0625rem] text-white/70 leading-[1.8]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (block.type === "image") {
              return (
                <figure key={i} className="my-10 -mx-4 sm:-mx-8">
                  <div className="relative w-full h-56 sm:h-80 overflow-hidden bg-neutral-200">
                    <Image
                      src={block.src}
                      alt={block.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 672px"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-3 px-4 sm:px-8 text-xs text-white/35 italic">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );
            }

            if (block.type === "faq") {
              return (
                <div key={i} className="mt-14 mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-8">
                    Frequently asked questions
                  </h2>
                  <div className="space-y-0 border-t border-white/10">
                    {block.items.map((item, j) => (
                      <div key={j} className="border-b border-white/10 py-6">
                        <p className="font-extrabold text-white text-base tracking-tight mb-3">
                          {item.q}
                        </p>
                        <p className="text-[1.0rem] text-white/60 leading-[1.8]">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (block.type === "cta") {
              return (
                <div key={i} className="mt-14 -mx-4 sm:-mx-8">
                  <div className="px-8 sm:px-12 py-12" style={{ background: ACCENT }}>
                    <p className={`${mono.className} text-[11px] font-bold uppercase tracking-[0.3em] text-black/55 mb-3`}>
                      MixReflect
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight mb-6">
                      Find out what&apos;s working<br />in your track.
                    </h3>
                    <p className="text-black/70 text-sm mb-8 leading-relaxed max-w-sm">
                      Paste a link and get an instant AI score — out of 100, with a verdict and a full breakdown — plus honest reactions from a room of real listeners. Free to submit.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 bg-black text-[#6ee7ff] font-extrabold px-8 py-4 text-sm hover:bg-[#141414] transition-colors"
                    >
                      Score my track free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* ── MORE POSTS ───────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
          <p className={`${mono.className} text-[11px] uppercase tracking-[0.3em] text-white/30 mb-6`}>
            More from The Drop
          </p>
          <div className="grid sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {posts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group bg-[#0a0a0a] p-7 hover:bg-[#0e0e0e] transition-colors flex flex-col gap-3"
                >
                  <span className={`${mono.className} self-start text-[10px] uppercase tracking-[0.25em] text-black px-2 py-1`} style={{ background: ACCENT }}>
                    {p.category}
                  </span>
                  <h3 className="font-extrabold text-white text-lg tracking-tight leading-tight group-hover:text-[#6ee7ff] transition-colors">
                    {p.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className={`${mono.className} text-[11px] text-white/30 uppercase tracking-widest`}>
                      {p.readTime}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/25 group-hover:text-[#6ee7ff] group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
