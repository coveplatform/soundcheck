import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
      </div>

      <p className="text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-4 text-sm text-neutral-700 leading-6">
        <p>
          SoundCheck is a marketplace that helps artists collect structured feedback on music and
          helps reviewers earn money for completing reviews.
        </p>

        <h2 className="text-lg font-semibold">User responsibilities</h2>
        <p>
          You agree to provide accurate account information and to use SoundCheck in good faith.
          Reviewers agree to provide honest, constructive feedback. Artists agree they own or have
          rights to share the submitted content.
        </p>

        <h2 className="text-lg font-semibold">Payments</h2>
        <p>
          Payments are processed through Stripe. Prices are shown at checkout. You are responsible
          for any taxes required by your jurisdiction.
        </p>

        <h2 className="text-lg font-semibold">Refund policy</h2>
        <p>
          Refunds may be available if reviews have not started. For MVP, refunds are handled
          manually by support.
        </p>

        <h2 className="text-lg font-semibold">Content ownership</h2>
        <p>
          You retain ownership of your content. By submitting a track, you grant SoundCheck and
          assigned reviewers permission to access the track for the purpose of completing feedback.
        </p>

        <h2 className="text-lg font-semibold">Liability</h2>
        <p>
          SoundCheck is provided on an “as is” basis. We do not guarantee a specific outcome,
          placement, or commercial results from feedback.
        </p>

        <h2 className="text-lg font-semibold">Contact</h2>
        <p>
          For support and policy questions, contact us at the email address listed on the site.
        </p>
      </div>
    </div>
  );
}
