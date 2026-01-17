import Link from "next/link";
import { Logo } from "@/components/ui/logo";

import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white pt-[68px]">
      {/* Header */}
      <header className="border-b-2 border-black fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black">Privacy Policy</h1>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>

        <p className="text-sm text-neutral-600 font-mono">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-neutral-700 leading-7">
          <p>
            This policy describes how MixReflect collects and uses information to operate the
            service.
          </p>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Data we collect</h2>
            <p>
              We collect account information (email, name), submitted track metadata, review content,
              and transaction metadata needed to process payments.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">How we use data</h2>
            <p>
              We use your information to authenticate you, match reviewers to tracks, process payments,
              prevent abuse, and improve product quality.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Third parties</h2>
            <p>
              Payments are processed by Stripe. Emails may be sent using Resend. These providers may
              receive information needed to provide their services.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Cookies</h2>
            <p>
              We use cookies for authentication and security. You can control cookie settings in your
              browser.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Your rights</h2>
            <p>
              You can request access to or deletion of your account data, subject to legal and
              operational requirements.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Contact</h2>
            <p>
              For privacy questions, contact us at the email address listed on the site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
