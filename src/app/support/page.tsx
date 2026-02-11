import Link from "next/link";
import { LifeBuoy, Mail, Shield, Trash2, MessageSquare, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mixreflect.com";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="pb-6 border-b border-black/10">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-black">Support</h1>
        <p className="text-sm text-black/40 mt-2">
          Need help? Reach out and we&apos;ll get you sorted.
        </p>
      </div>

      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="h-6 w-6 text-purple-600" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-black">Email support</p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-150 ease-out"
            >
              <Mail className="h-4 w-4" />
              {supportEmail}
            </a>
            <p className="text-sm text-black/40">
              Include your account email and a short description of the issue.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/support/tickets"
          className="group rounded-2xl border border-black/8 bg-white p-5 transition-colors duration-150 ease-out hover:border-black/12 hover:bg-white/80"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-semibold text-black">Support tickets</p>
          </div>
          <p className="text-sm text-black/40">Create a ticket and track replies in-app.</p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-colors duration-150 ease-out">
            Go to tickets <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/forgot-password"
          className="group rounded-2xl border border-black/8 bg-white p-5 transition-colors duration-150 ease-out hover:border-black/12 hover:bg-white/80"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-semibold text-black">Password & sign in</p>
          </div>
          <p className="text-sm text-black/40">
            Reset your password from the login flow.
          </p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-colors duration-150 ease-out">
            Reset password <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/account"
          className="group rounded-2xl border border-black/8 bg-white p-5 transition-colors duration-150 ease-out hover:border-black/12 hover:bg-white/80"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-neutral-500" />
            </div>
            <p className="font-semibold text-black">Account deletion</p>
          </div>
          <p className="text-sm text-black/40">
            Request deletion from Account settings (if eligible).
          </p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-black/40 group-hover:text-black transition-colors duration-150 ease-out">
            Account settings <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <p className="text-xs font-mono tracking-[0.15em] uppercase text-black/40 mb-3">Legal</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="font-medium text-black/50 hover:text-black transition-colors duration-150 ease-out">
            Terms of Service
          </Link>
          <Link href="/privacy" className="font-medium text-black/50 hover:text-black transition-colors duration-150 ease-out">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
