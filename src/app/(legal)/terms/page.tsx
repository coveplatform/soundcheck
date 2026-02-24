import Link from "next/link";
import { Logo } from "@/components/ui/logo";

import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
          <h1 className="text-3xl font-black">Terms of Service</h1>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>

        <p className="text-sm text-neutral-600 font-mono">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-neutral-700 leading-7">
          <p>
            MixReflect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a two-sided marketplace
            that helps artists collect structured, expert feedback on their music and helps
            reviewers earn money for completing high-quality reviews. MixReflect is operated by
            MixReflect, based in Melbourne, Victoria, Australia. By creating an account or
            using MixReflect, you agree to these terms.
          </p>

          {/* ── 1. Accounts ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">1. Accounts and profiles</h2>
            <p>
              You must provide accurate information when creating your account. You are responsible
              for keeping your login credentials secure. You may create an artist profile, a
              reviewer profile, or both. Artist profiles include your artist name, genre preferences,
              and optional bio. Reviewer profiles include your display name and payout details.
            </p>
          </div>

          {/* ── 2. Track Submissions ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">2. Track submissions</h2>
            <p>
              Artists submit tracks by providing a link (SoundCloud, Spotify, YouTube, etc.) or by
              uploading an audio file directly. Each submission includes a title, genre tags, an
              optional artist note for reviewers, and a visibility setting.
            </p>

            <h3 className="font-bold mt-4 mb-1">Public vs. private visibility</h3>
            <p>
              You choose whether each track is <strong>public</strong> or <strong>private</strong> at
              submission time. <strong>Public tracks</strong> may appear in the Weekly Discover
              section, the 3D Discover experience, and the landing page — visible to all visitors.
              This includes your track title, artist name, artwork, genre tags, play count, and an
              embedded player or link to the audio source. <strong>Private tracks</strong> are only
              accessible to you and the reviewers assigned to your track. You can change visibility
              at any time from your track settings.
            </p>

            <h3 className="font-bold mt-4 mb-1">Slot limits</h3>
            <p>
              Free accounts may have up to 1 active track in the review queue at a time. Pro
              subscribers may have up to 3. A slot is considered active while the track is in
              PENDING_PAYMENT, QUEUED, or IN_PROGRESS status.
            </p>
          </div>

          {/* ── 3. Reviews ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">3. Reviews and feedback</h2>
            <p>
              Reviewers are assigned tracks from the review queue and must listen for a minimum of
              180 seconds before submitting feedback. Reviews include structured ratings, free-text
              feedback, and optional timestamp annotations. Reviewers agree to provide honest,
              constructive, and specific feedback. Low-quality or fraudulent reviews may be flagged
              and removed.
            </p>
            <p className="mt-3">
              While listening, behavioural signals (play, pause, seek, volume, tab focus) are
              passively captured to improve feedback quality and provide artists with aggregate
              engagement insights. This data is never shared publicly.
            </p>
          </div>

          {/* ── 4. Payments ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">4. Payments</h2>

            <h3 className="font-bold mt-4 mb-1">Artist payments</h3>
            <p>
              Track submissions are paid for via Stripe Checkout. Prices are displayed at checkout
              and depend on the feedback package selected. You are responsible for any taxes required
              by your jurisdiction.
            </p>

            <h3 className="font-bold mt-4 mb-1">Pro subscriptions</h3>
            <p>
              MixReflect Pro is available at $9.99/month or $79.99/year. Pro provides 3 active
              slots, priority queue placement, a Pro badge, and early access to new features. You
              can manage your subscription and billing through the Stripe Customer Portal. Pro
              subscriptions auto-renew unless cancelled.
            </p>

            <h3 className="font-bold mt-4 mb-1">Reviewer payouts</h3>
            <p>
              Reviewers earn money for each completed review. Earnings accrue as a pending balance
              and can be withdrawn via Stripe Connect transfer. Reviewers must complete Stripe
              Connect onboarding to receive payouts. MixReflect is not responsible for Stripe&apos;s
              processing fees or payout schedules.
            </p>
          </div>

          {/* ── 5. Refund Policy ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">5. Refund policy</h2>
            <p>
              Refunds may be available if no reviews have been started on your track. Once a
              reviewer has been assigned and begun work, the submission is non-refundable. Refund
              requests are handled by support on a case-by-case basis.
            </p>
          </div>

          {/* ── 6. Content Ownership ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">6. Content ownership</h2>
            <p>
              You retain full ownership of your music and any content you submit to MixReflect. By
              submitting a track, you grant MixReflect and assigned reviewers a limited,
              non-exclusive licence to access and stream the track solely for the purpose of
              providing feedback. If you mark a track as public, you additionally grant MixReflect
              permission to display the track title, artwork, artist name, genre tags, and an
              embedded player in public-facing sections of the site (Weekly Discover, landing page,
              3D Discover experience). This licence terminates when you delete the track or set it
              to private.
            </p>
            <p className="mt-3">
              Review content (text, ratings, timestamps) is owned by the reviewer who wrote it and
              is licensed to MixReflect and the track owner for use within the platform, including
              in aggregate feedback synthesis reports.
            </p>
          </div>

          {/* ── 7. Prohibited Conduct ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">7. Prohibited conduct</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Submitting tracks you do not own or have rights to share.</li>
              <li>Submitting fraudulent, plagiarised, or deliberately low-quality reviews.</li>
              <li>Attempting to manipulate the review queue, play counts, or rating system.</li>
              <li>Creating multiple accounts to circumvent slot limits or other restrictions.</li>
              <li>Harassing, threatening, or abusing other users via reviews, notes, or support.</li>
              <li>Uploading malicious files or attempting to exploit the platform technically.</li>
            </ul>
            <p className="mt-3">
              Violation of these terms may result in account suspension or termination at our
              discretion.
            </p>
          </div>

          {/* ── 8. Liability ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">8. Limitation of liability</h2>
            <p>
              MixReflect is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
              do not guarantee a specific outcome, placement, or commercial results from feedback.
              We do not guarantee the accuracy, quality, or usefulness of any review. To the
              maximum extent permitted by law, MixReflect shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the service.
            </p>
          </div>

          {/* ── 9. Termination ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">9. Termination</h2>
            <p>
              You may delete your account at any time. We may suspend or terminate your account if
              you violate these terms. On termination, your personal data will be handled as
              described in our{" "}
              <Link href="/privacy" className="underline font-bold">Privacy Policy</Link>.
              Outstanding reviewer balances will be paid out per Stripe Connect terms, subject to
              fraud review.
            </p>
          </div>

          {/* ── 10. Changes ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">10. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated
              via email or an in-app notice. Continued use of MixReflect after changes constitutes
              acceptance of the updated terms.
            </p>
          </div>

          {/* ── 11. Governing Law ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">11. Governing law</h2>
            <p>
              These Terms of Service are governed by the laws of Victoria, Australia. Any dispute
              arising out of or in connection with these terms that cannot be resolved informally
              will be subject to the exclusive jurisdiction of the courts of Victoria, Australia.
            </p>
            <p className="mt-3">
              If you access MixReflect from outside Australia, you are responsible for compliance
              with your local laws to the extent they are applicable.
            </p>
          </div>

          {/* ── Contact ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Contact</h2>
            <p>
              For support and policy questions, contact us at{" "}
              <a href="mailto:support@mixreflect.com" className="underline font-bold">
                support@mixreflect.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
