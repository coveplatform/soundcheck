import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { posts, getPost } from "@/lib/blog-posts";
import type { Metadata } from "next";

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
    title: `${post.title} — MixReflect Journal`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
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

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition-colors mb-10"
          >
            <ArrowLeft className="h-3 w-3" />
            Journal
          </Link>

          <div className="mb-6">
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.3em] text-white bg-purple-600 px-3 py-1.5">
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

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div className="bg-[#faf8f5]">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
          {post.content.map((block, i) => {
            if (block.type === "paragraph") {
              return (
                <p
                  key={i}
                  className="text-[1.0625rem] text-black/75 leading-[1.8] mb-6 font-medium"
                >
                  {block.text}
                </p>
              );
            }

            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-tight mt-14 mb-5"
                >
                  {block.text}
                </h2>
              );
            }

            if (block.type === "quote") {
              return (
                <div key={i} className="my-10 -mx-4 sm:-mx-8">
                  <div className="bg-[#0d0d0d] px-8 sm:px-12 py-10 border-l-4 border-purple-500">
                    <p
                      className="font-black text-white leading-tight tracking-tight"
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
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                      <span className="text-[1.0625rem] text-black/75 leading-[1.8] font-medium">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (block.type === "cta") {
              return (
                <div key={i} className="mt-14 -mx-4 sm:-mx-8">
                  <div className="bg-purple-600 px-8 sm:px-12 py-12 border-t-4 border-black">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">
                      MixReflect
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-6">
                      Find out what&apos;s working<br />in your track.
                    </h3>
                    <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed max-w-sm">
                      Upload your track and get structured feedback from artists in your genre — usually within 24 hours.
                    </p>
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 bg-white text-black font-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-colors border-2 border-white"
                    >
                      Start free
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
      <div className="border-t-4 border-black bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-6">
            More from the journal
          </p>
          <div className="grid sm:grid-cols-2 gap-px bg-black border border-black">
            {posts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group bg-[#faf8f5] p-7 hover:bg-white transition-colors flex flex-col gap-3"
                >
                  <span className="self-start text-[10px] font-black uppercase tracking-[0.25em] text-white px-2 py-1 bg-black">
                    {p.category}
                  </span>
                  <h3 className="font-black text-black text-lg tracking-tight leading-tight group-hover:text-purple-700 transition-colors">
                    {p.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-[11px] font-bold text-black/25 uppercase tracking-widest">
                      {p.readTime}
                    </span>
                    <ArrowRight className="h-4 w-4 text-black/25 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
