import Link from "next/link";
import { Mail, ArrowRight, MessageSquare, Shield, Trash2 } from "lucide-react";
import { SquiggleDoodle } from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mixreflect.com";

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SquiggleDoodle className="absolute -bottom-5 left-[45%] w-20 h-20 text-purple-400/20 pointer-events-none rotate-6" />
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
              Support.
            </h1>
            <p className="text-sm text-black/40 font-medium mt-2">
              Need help? Reach out and we&apos;ll get you sorted.
            </p>
          </div>
        </div>
      </div>

      {/* ── EMAIL CTA — dark block ──────────────────────────────── */}
      <div className="bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">
              Fastest way
            </p>
            <h2 className="text-2xl font-black text-white tracking-tight leading-none">
              Email us directly.
            </h2>
            <p className="text-sm text-white/40 font-medium mt-1.5">
              Include your account email and a short description of the issue.
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
      </div>

      {/* ── ACTION ROWS ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-3">

        <Link
          href="/support/tickets"
          className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">In-app</p>
              </div>
              <p className="text-xl font-black text-black">Support Tickets</p>
              <p className="text-sm text-black/40 font-medium mt-1">
                Create a ticket and track replies in one place.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
          </div>
        </Link>

        <Link
          href="/forgot-password"
          className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Account</p>
              </div>
              <p className="text-xl font-black text-black">Password & Sign In</p>
              <p className="text-sm text-black/40 font-medium mt-1">
                Reset your password from the login flow.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
          </div>
        </Link>

        <Link
          href="/account"
          className="group block rounded-2xl border-2 border-black/8 bg-white px-6 py-5 hover:border-black/20 hover:-translate-y-[1px] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] active:translate-y-0 active:shadow-none transition-all duration-150"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="h-3.5 w-3.5 text-black/30" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/30">Settings</p>
              </div>
              <p className="text-xl font-black text-black">Account Deletion</p>
              <p className="text-sm text-black/40 font-medium mt-1">
                Request deletion from Account settings if eligible.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-black/20 group-hover:text-black transition-colors flex-shrink-0" />
          </div>
        </Link>

        {/* Legal */}
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
