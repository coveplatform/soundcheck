import Link from "next/link";
import { LifeBuoy, Mail, Shield, Trash2, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mixreflect.com";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black">Support</h1>
        <p className="text-neutral-600 mt-1">
          Need help? Reach out and we&apos;ll get you sorted.
        </p>
      </div>

      <div className="border-2 border-black bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-neutral-100 border-2 border-black flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="h-6 w-6 text-black" />
          </div>
          <div className="space-y-2">
            <p className="font-bold">Email support</p>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-black hover:underline underline-offset-4"
            >
              <Mail className="h-4 w-4" />
              {supportEmail}
            </a>
            <p className="text-sm text-neutral-600">
              Include your account email and a short description of the issue.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border-2 border-black bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4" />
            <p className="font-bold">Support tickets</p>
          </div>
          <p className="text-sm text-neutral-600">Create a ticket and track replies in-app.</p>
          <div className="mt-3">
            <Link href="/support/tickets" className="text-sm font-bold text-neutral-600 hover:text-black">
              Go to tickets
            </Link>
          </div>
        </div>

        <div className="border-2 border-black bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <p className="font-bold">Password & sign in</p>
          </div>
          <p className="text-sm text-neutral-600">
            Reset your password from the login flow.
          </p>
          <div className="mt-3">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-neutral-600 hover:text-black"
            >
              Go to password reset
            </Link>
          </div>
        </div>

        <div className="border-2 border-black bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-4 w-4" />
            <p className="font-bold">Account deletion</p>
          </div>
          <p className="text-sm text-neutral-600">
            You can request deletion from Account settings (if eligible).
          </p>
          <div className="mt-3">
            <Link
              href="/account"
              className="text-sm font-bold text-neutral-600 hover:text-black"
            >
              Go to Account settings
            </Link>
          </div>
        </div>
      </div>

      <div className="border-2 border-black bg-white p-6">
        <p className="font-bold mb-2">Legal</p>
        <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
          <Link href="/terms" className="hover:text-black font-medium">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-black font-medium">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
