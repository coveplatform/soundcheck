import Link from "next/link";
import { Logo } from "@/components/ui/logo";

import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <Logo />
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black">Terms of Service</h1>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>

        <p className="text-sm text-neutral-600 font-mono">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-neutral-700 leading-7">
          <p>
            MixReflect is a marketplace that helps artists collect structured feedback on music and
            helps reviewers earn money for completing reviews.
          </p>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">User responsibilities</h2>
            <p>
              You agree to provide accurate account information and to use MixReflect in good faith.
              Reviewers agree to provide honest, constructive feedback. Artists agree they own or have
              rights to share the submitted content.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Payments</h2>
            <p>
              Payments are processed through Stripe. Prices are shown at checkout. You are responsible
              for any taxes required by your jurisdiction.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Refund policy</h2>
            <p>
              Refunds may be available if reviews have not started. For MVP, refunds are handled
              manually by support.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Content ownership</h2>
            <p>
              You retain ownership of your content. By submitting a track, you grant MixReflect and
              assigned reviewers permission to access the track for the purpose of completing feedback.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Liability</h2>
            <p>
              MixReflect is provided on an &quot;as is&quot; basis. We do not guarantee a specific outcome,
              placement, or commercial results from feedback.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Contact</h2>
            <p>
              For support and policy questions, contact us at the email address listed on the site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
