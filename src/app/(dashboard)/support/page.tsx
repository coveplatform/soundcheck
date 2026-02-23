import Link from "next/link";
import { LifeBuoy, Mail, Shield, Trash2, MessageSquare, ArrowRight } from "lucide-react";
import { DotsDoodle } from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mixreflect.com";

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <DotsDoodle className="absolute -bottom-3 left-[40%] w-20 h-20 text-purple-400/20 pointer-events-none rotate-12" />
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
              Support.
            </h1>
            <p className="text-sm text-black/40 font-medium mt-3">
              Need help? Reach out and we&apos;ll get you sorted.
            </p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Email CTA — dark block */}
        <div className="bg-neutral-900 rounded-2xl px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="h-6 w-6 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white">Email support</p>
            <p className="text-sm text-white/40 font-medium mt-0.5">
              Include your account email and a short description of the issue.
            </p>
          </div>
          <a
            href={`mailto:${supportEmail}`}
            className="flex-shrink-0 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black bg-lime-400 hover:bg-lime-300 border-2 border-black px-4 py-2 rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Mail className="h-3.5 w-3.5" />
            Email us
          </a>
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/support/tickets"
            className="group rounded-2xl border-2 border-black/8 bg-white p-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <MessageSquare className="h-4.5 w-4.5 text-purple-600" />
              </div>
              <p className="font-black text-black">Support tickets</p>
            </div>
            <p className="text-sm text-black/40 font-medium mb-4">Create a ticket and track replies in-app.</p>
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-purple-600 group-hover:text-purple-800 transition-colors">
              Go to tickets <ArrowRight className="h-3 w-3" />
            </div>
          </Link>

          <Link
            href="/forgot-password"
            className="group rounded-2xl border-2 border-black/8 bg-white p-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="h-4.5 w-4.5 text-purple-600" />
              </div>
              <p className="font-black text-black">Password & sign in</p>
            </div>
            <p className="text-sm text-black/40 font-medium mb-4">Reset your password from the login flow.</p>
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-purple-600 group-hover:text-purple-800 transition-colors">
              Reset password <ArrowRight className="h-3 w-3" />
            </div>
          </Link>

          <Link
            href="/account"
            className="group rounded-2xl border-2 border-black/8 bg-white p-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Trash2 className="h-4.5 w-4.5 text-neutral-500" />
              </div>
              <p className="font-black text-black">Account deletion</p>
            </div>
            <p className="text-sm text-black/40 font-medium mb-4">Request deletion from Account settings (if eligible).</p>
            <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black/30 group-hover:text-black transition-colors">
              Account settings <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        </div>

        {/* Legal footer strip */}
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
