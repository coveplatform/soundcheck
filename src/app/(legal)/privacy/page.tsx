import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
      </div>

      <p className="text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-4 text-sm text-neutral-700 leading-6">
        <p>
          This policy describes how SoundCheck collects and uses information to operate the
          service.
        </p>

        <h2 className="text-lg font-semibold">Data we collect</h2>
        <p>
          We collect account information (email, name), submitted track metadata, review content,
          and transaction metadata needed to process payments.
        </p>

        <h2 className="text-lg font-semibold">How we use data</h2>
        <p>
          We use your information to authenticate you, match reviewers to tracks, process payments,
          prevent abuse, and improve product quality.
        </p>

        <h2 className="text-lg font-semibold">Third parties</h2>
        <p>
          Payments are processed by Stripe. Emails may be sent using Resend. These providers may
          receive information needed to provide their services.
        </p>

        <h2 className="text-lg font-semibold">Cookies</h2>
        <p>
          We use cookies for authentication and security. You can control cookie settings in your
          browser.
        </p>

        <h2 className="text-lg font-semibold">Your rights</h2>
        <p>
          You can request access to or deletion of your account data, subject to legal and
          operational requirements.
        </p>

        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For privacy questions, contact us at the email address listed on the site.
        </p>
      </div>
    </div>
  );
}
