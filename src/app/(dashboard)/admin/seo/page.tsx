import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { posts } from "@/lib/blog-posts";
import { alternativePages } from "@/lib/alternatives";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "kris.engelhardt4@gmail.com";

const BLOG_QUEUE = [
  { title: "How to Mix Music at Home: A Beginner's Guide", keyword: "how to mix music at home", note: "Huge volume; early funnel" },
  { title: "How to Get on Spotify's Discover Weekly", keyword: "how to get on discover weekly", note: "High intent, specific" },
  { title: "Music Release Checklist: What to Do Before You Drop", keyword: "music release checklist", note: "AEO gold" },
  { title: "How to Promote Your Music on Spotify (Without a Label)", keyword: "how to promote music on spotify", note: "High volume" },
  { title: "How to Get Music Reviews Online (Honest, Useful Ones)", keyword: "how to get music reviews online", note: "Direct MixReflect keyword" },
  { title: "Is Your Mix Good? 6 Ways to Know Before You Release", keyword: "how to know if your mix is good", note: "Strong AEO format" },
  { title: "How to Master Music at Home (And When to Hire Out)", keyword: "how to master music at home", note: "High volume" },
  { title: "How to Build a Fanbase as an Independent Artist", keyword: "how to build a fanbase", note: "Top of funnel" },
  { title: "How to Copyright Your Music (What Artists Actually Need to Know)", keyword: "how to copyright music", note: "High volume, question-based" },
];

const ALTERNATIVES_QUEUE = [
  { slug: "distrokid", competitor: "DistroKid", note: '"distrokid alternative" is massive' },
  { slug: "splice", competitor: "Splice", note: "Different product but huge search" },
  { slug: "soundcloud", competitor: "SoundCloud", note: "Broad but massive" },
];

export default async function AdminSEOPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const publishedPosts = [...posts].reverse();

  const highestImage = Math.max(
    ...publishedPosts
      .map((p) => {
        const m = p.coverImage?.match(/blog(\d+)\.jpg/);
        return m ? parseInt(m[1]) : 0;
      })
      .filter((n) => n > 0),
    0
  );

  const totalLive = publishedPosts.length + alternativePages.length;
  const totalQueued = BLOG_QUEUE.length + ALTERNATIVES_QUEUE.length;

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-1">Admin</p>
          <h1 className="text-4xl font-black tracking-tighter text-black leading-none">SEO Dashboard</h1>
          <p className="text-sm text-black/40 font-medium mt-2">
            {totalLive} pages live · {totalQueued} queued
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="border-2 border-black bg-white rounded-2xl px-4 py-4">
            <p className="text-3xl font-black text-black tabular-nums">{publishedPosts.length}</p>
            <p className="text-xs font-black uppercase tracking-widest text-black/30 mt-1">Blog posts</p>
          </div>
          <div className="border-2 border-black bg-white rounded-2xl px-4 py-4">
            <p className="text-3xl font-black text-black tabular-nums">{alternativePages.length}</p>
            <p className="text-xs font-black uppercase tracking-widest text-black/30 mt-1">Alt pages</p>
          </div>
          <div className="border-2 border-black bg-white rounded-2xl px-4 py-4">
            <p className="text-3xl font-black text-black tabular-nums">30</p>
            <p className="text-xs font-black uppercase tracking-widest text-black/30 mt-1">Genre pages</p>
          </div>
          <div className="border-2 border-black bg-white rounded-2xl px-4 py-4">
            <p className="text-3xl font-black text-black tabular-nums">
              {highestImage > 0 ? `blog${highestImage + 1}` : "—"}
            </p>
            <p className="text-xs font-black uppercase tracking-widest text-black/30 mt-1">Next image</p>
          </div>
        </div>

        {/* ── BLOG POSTS ── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Blog — The Drop</p>
              <h2 className="text-2xl font-black tracking-tight text-black leading-none mt-0.5">
                {publishedPosts.length} published · {BLOG_QUEUE.length} in queue
              </h2>
            </div>
            <Link
              href="https://mixreflect.com/blog"
              target="_blank"
              className="text-[11px] font-black uppercase tracking-wider text-black/30 hover:text-black transition-colors"
            >
              View live →
            </Link>
          </div>

          <div className="h-2 bg-black/10 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-black rounded-full"
              style={{ width: `${Math.round((publishedPosts.length / (publishedPosts.length + BLOG_QUEUE.length)) * 100)}%` }}
            />
          </div>

          {/* Published */}
          <div className="border-2 border-black rounded-2xl overflow-hidden mb-3">
            <div className="bg-black px-4 py-2.5 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Published</span>
              <span className="text-[10px] font-black text-lime-400">{publishedPosts.length}</span>
            </div>
            <div className="divide-y divide-black/8">
              {publishedPosts.map((post) => (
                <div key={post.slug} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-black truncate">{post.title}</span>
                  <span className="text-xs text-black/35 font-medium whitespace-nowrap hidden sm:block">{post.date}</span>
                  <Link
                    href={`https://mixreflect.com/blog/${post.slug}`}
                    target="_blank"
                    className="text-[11px] font-black text-black/30 hover:text-black transition-colors"
                  >
                    ↗
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Queue */}
          <div className="border-2 border-black/20 rounded-2xl overflow-hidden">
            <div className="bg-black/5 px-4 py-2.5 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Queue</span>
              <span className="text-[10px] font-black text-black/40">{BLOG_QUEUE.length} pending</span>
            </div>
            <div className="divide-y divide-black/8">
              {BLOG_QUEUE.map((item, i) => (
                <div key={item.title} className="flex items-start gap-3 px-4 py-3 bg-white">
                  <span className="text-[11px] font-black text-black/20 w-5 flex-shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black/60 truncate">{item.title}</p>
                    <p className="text-xs text-black/30 font-mono mt-0.5 truncate">{item.keyword}</p>
                  </div>
                  <span className="text-[10px] font-medium text-black/25 whitespace-nowrap text-right max-w-[140px] leading-tight hidden sm:block">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ALTERNATIVES ── */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Alternatives Pages</p>
              <h2 className="text-2xl font-black tracking-tight text-black leading-none mt-0.5">
                {alternativePages.length} published · {ALTERNATIVES_QUEUE.length} in queue
              </h2>
            </div>
          </div>

          <div className="h-2 bg-black/10 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-black rounded-full"
              style={{ width: `${Math.round((alternativePages.length / (alternativePages.length + ALTERNATIVES_QUEUE.length)) * 100)}%` }}
            />
          </div>

          <div className="border-2 border-black rounded-2xl overflow-hidden mb-3">
            <div className="bg-black px-4 py-2.5 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Published</span>
              <span className="text-[10px] font-black text-lime-400">{alternativePages.length}</span>
            </div>
            <div className="divide-y divide-black/8">
              {alternativePages.map((alt) => (
                <div key={alt.slug} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-black truncate">{alt.competitor} alternative</span>
                  <span className="text-xs text-black/35 font-mono hidden sm:block">/alternatives/{alt.slug}</span>
                  <Link
                    href={`https://mixreflect.com/alternatives/${alt.slug}`}
                    target="_blank"
                    className="text-[11px] font-black text-black/30 hover:text-black transition-colors"
                  >
                    ↗
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-black/20 rounded-2xl overflow-hidden">
            <div className="bg-black/5 px-4 py-2.5 flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Queue</span>
              <span className="text-[10px] font-black text-black/40">{ALTERNATIVES_QUEUE.length} pending</span>
            </div>
            <div className="divide-y divide-black/8">
              {ALTERNATIVES_QUEUE.map((item, i) => (
                <div key={item.slug} className="flex items-start gap-3 px-4 py-3 bg-white">
                  <span className="text-[11px] font-black text-black/20 w-5 flex-shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black/60">{item.competitor} alternative</p>
                    <p className="text-xs text-black/30 font-mono">/alternatives/{item.slug}</p>
                  </div>
                  <span className="text-[10px] font-medium text-black/25 whitespace-nowrap text-right max-w-[160px] leading-tight hidden sm:block">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUICK LINKS ── */}
        <section className="border-t-2 border-black/10 pt-6 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30 mb-3">Quick links</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Search Console", href: "https://search.google.com/search-console" },
              { label: "Content calendar", href: "https://github.com/coveplatform/soundcheck/blob/main/seo/content-calendar.md" },
              { label: "Routines", href: "https://claude.ai/code/routines" },
              { label: "Blog", href: "https://mixreflect.com/blog" },
              { label: "Genre pages", href: "https://mixreflect.com/feedback/hip-hop" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                className="text-[11px] font-black uppercase tracking-wider border-2 border-black px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-colors"
              >
                {link.label} ↗
              </Link>
            ))}
          </div>
          {highestImage > 0 && (
            <p className="text-xs text-black/30 mt-4 font-medium">
              Next cover image: upload{" "}
              <span className="font-mono font-black text-black/50">public/blog/blog{highestImage + 1}.jpg</span>{" "}
              before the weekly agent runs.
            </p>
          )}
        </section>

      </div>
    </div>
  );
}
