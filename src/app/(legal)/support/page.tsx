import Link from "next/link";
import { Mail, MessageSquare, ArrowRight, Shield, Trash2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — MixReflect",
  description:
    "Get help with MixReflect. Contact our support team, submit a ticket, or find answers to common questions.",
};

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mixreflect.com";

export default function PublicSupportPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] pt-[64px]">

      {/* Header */}
      <header className="border-b-2 border-black fixed top-0 left-0 right-0 z-50 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95] mb-3">
            Support
          </h1>
          <p className="text-black/50 font-medium">
            Need help? We&apos;re a small team and we actually read every message.
          </p>
        </div>

        {/* Email CTA */}
        <div className="bg-black rounded-2xl px-6 py-7 mb-4 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Fastest</p>
            <h2 className="text-xl font-black text-white tracking-tight">Email us directly</h2>
            <p className="text-sm text-white/40 font-medium mt-1">
              We respond within 24 hours, usually faster.
            </p>
          </div>
          <a
            href={`mailto:${supportEmail}`}
            className="flex-shrink-0 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black bg-lime-400 hover:bg-lime-300 border-2 border-black px-5 py-2.5 rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all whitespace-nowrap"
          >
            <Mail className="h-3.5 w-3.5" />
            {supportEmail}
          </a>
        </div>

        {/* Option cards */}
        <div className="space-y-3 mb-10">

          <Link
            href="/login"
            className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">In-app</p>
                </div>
                <p className="text-lg font-black text-black">Submit a support ticket</p>
                <p className="text-sm text-black/40 font-medium mt-0.5">
                  Log in to create a ticket and track replies in one place.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
            </div>
          </Link>

          <Link
            href="/forgot-password"
            className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3.5 w-3.5 text-purple-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Account</p>
                </div>
                <p className="text-lg font-black text-black">Reset your password</p>
                <p className="text-sm text-black/40 font-medium mt-0.5">
                  Can&apos;t sign in? Reset your password from the login page.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
            </div>
          </Link>

          <Link
            href="/login"
            className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="h-3.5 w-3.5 text-black/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Settings</p>
                </div>
                <p className="text-lg font-black text-black">Delete your account</p>
                <p className="text-sm text-black/40 font-medium mt-0.5">
                  Account deletion is available from your account settings after signing in.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
            </div>
          </Link>

        </div>

        {/* Common questions */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-black mb-4">Common questions</h2>
          <div className="bg-white rounded-2xl border-2 border-black/8 overflow-hidden divide-y divide-black/5">
            {[
              {
                q: "How do credits work?",
                a: "Every review you write earns one credit. Spend credits to get reviews on your own tracks. It's give-one-get-one — no money required.",
              },
              {
                q: "How long does it take to get reviews?",
                a: "Most tracks receive their first review within a few hours. Full completion (3–10 reviews depending on what you requested) typically takes 24–72 hours.",
              },
              {
                q: "Can I get a refund on credits?",
                a: "If your track didn't receive the reviews you paid for, reach out and we'll make it right. Email us at support@mixreflect.com.",
              },
              {
                q: "Is my unreleased music safe?",
                a: "Yes. Your track is only heard by the genre-matched artists assigned to review it. We never share, publish, or distribute your music.",
              },
              {
                q: "How do I cancel my Pro subscription?",
                a: "You can cancel anytime from your account settings. You'll keep Pro access until the end of your billing period.",
              },
            ].map((item) => (
              <details key={item.q} className="px-5 py-4 group">
                <summary className="font-black text-black cursor-pointer hover:text-purple-700 transition-colors list-none flex items-center justify-between gap-3">
                  {item.q}
                  <ArrowRight className="h-4 w-4 text-black/20 flex-shrink-0 rotate-90 group-open:rotate-[270deg] transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-black/60 font-medium leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="border-t-2 border-black/8 pt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25">Legal</p>
          <Link href="/terms" className="text-sm font-bold text-black/40 hover:text-black transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm font-bold text-black/40 hover:text-black transition-colors">
            Privacy Policy
          </Link>
        </div>

      </div>
    </div>
  );
}
