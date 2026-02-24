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
            This policy describes how MixReflect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores,
            and shares information when you use our music feedback marketplace. By creating an
            account or using MixReflect, you agree to the practices described here.
          </p>

          {/* ── 1. Data We Collect ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">1. Data we collect</h2>

            <h3 className="font-bold mt-4 mb-1">Account information</h3>
            <p>
              When you sign up we collect your name, email address, and a hashed password (or OAuth
              credentials if you sign in via a third-party provider). If you create an artist
              profile we also store your artist name, genre preferences, and optional bio.
            </p>

            <h3 className="font-bold mt-4 mb-1">Track submissions</h3>
            <p>
              When you submit a track we store the track title, artist note, genre tags, source URL
              or link (e.g. SoundCloud, Spotify, YouTube), and any uploaded audio file. If you
              upload an MP3 or WAV file directly, the file is stored in cloud object storage
              (Amazon S3 or Cloudflare R2). We also store artwork images, either uploaded by you or
              fetched automatically from the linked platform via oEmbed.
            </p>

            <h3 className="font-bold mt-4 mb-1">Public vs. private tracks</h3>
            <p>
              When submitting a track you choose whether it is <strong>public</strong> or{" "}
              <strong>private</strong>. Public tracks may appear in the Weekly Discover section on
              our landing page and within the 3D Discover experience, visible to all visitors
              — including your track title, artist name, artwork, genre tags, and an embedded
              player or link to the audio source. Private tracks are only visible to you and the
              reviewers assigned to your track. You can change a track&apos;s visibility at any time
              from your track settings.
            </p>

            <h3 className="font-bold mt-4 mb-1">Reviews and feedback</h3>
            <p>
              We store the full content of every review, including structured ratings (production,
              originality, vocal quality, first impression, playlist action, quality assessment,
              release readiness verdict), free-text feedback (best moment, main feedback, artist
              note), timestamp annotations, and technical issue flags.
            </p>

            <h3 className="font-bold mt-4 mb-1">Listening behavior data</h3>
            <p>
              While a reviewer listens to a track, we passively capture behavioural signals from the
              audio player to improve feedback quality. This includes play, pause, and seek events;
              volume changes; replay and skip zones; tab focus/blur events; and the overall
              engagement curve. This data is used to compute metrics such as completion rate,
              attention score, and behavioural-explicit alignment (how well the reviewer&apos;s
              listening patterns match their written feedback). Listening behaviour data is
              associated with the review, not the reviewer&apos;s broader account, and is presented
              to artists only in aggregate across all reviewers for a given track.
            </p>

            <h3 className="font-bold mt-4 mb-1">Payment and payout information</h3>
            <p>
              We store transaction metadata (package selected, amount, currency, Stripe session and
              payment IDs) to track order status. For reviewer payouts we store your Stripe Connect
              account ID and payout history. We do not store full credit card numbers or bank
              account details — those are held by Stripe.
            </p>

            <h3 className="font-bold mt-4 mb-1">Subscription data</h3>
            <p>
              If you subscribe to MixReflect Pro we store your Stripe customer ID, subscription ID,
              and subscription status to manage your plan, slot limits, and billing.
            </p>

            <h3 className="font-bold mt-4 mb-1">Usage and analytics</h3>
            <p>
              We use PostHog for product analytics and may optionally use Microsoft Clarity for
              session replays. These tools collect anonymised interaction data such as page views,
              clicks, scroll depth, and device information. Public play counts on tracks are also
              recorded.
            </p>

            <h3 className="font-bold mt-4 mb-1">Support tickets</h3>
            <p>
              If you contact support, we store the subject, message body, and any follow-up messages
              to resolve your request.
            </p>

            <h3 className="font-bold mt-4 mb-1">Cookies and session data</h3>
            <p>
              We use cookies to authenticate your session (via NextAuth) and to remember your
              preferences. Authentication cookies are essential for the service to function.
              Analytics tools may set their own cookies — see section 5 below.
            </p>
          </div>

          {/* ── 2. How We Use Your Data ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">2. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Authenticate you and manage your account and artist/reviewer profiles.</li>
              <li>Match reviewers to tracks and manage the review queue (including priority placement for Pro subscribers).</li>
              <li>Process payments for track submissions and reviewer payouts via Stripe and Stripe Connect.</li>
              <li>Display public tracks, artwork, and artist names in the Weekly Discover section and on the landing page.</li>
              <li>Compute feedback quality scores (text specificity, actionability, technical depth) to surface higher-quality reviews.</li>
              <li>Analyse listening behaviour to provide artists with aggregate engagement insights (replay hotspots, drop-off points, attention curves).</li>
              <li>Generate automated feedback synthesis reports that combine multiple reviews into actionable summaries.</li>
              <li>Send transactional emails (review completion notifications, payment receipts, account verification) via Resend.</li>
              <li>Send optional announcement or marketing emails (you can unsubscribe at any time).</li>
              <li>Detect and prevent abuse, fraud, and low-quality reviews.</li>
              <li>Improve product quality through analytics and aggregated usage patterns.</li>
              <li>Enforce slot limits (Free: 1 active slot, Pro: 3 active slots) and subscription status.</li>
            </ul>
          </div>

          {/* ── 3. What We Share Publicly ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">3. What we share publicly</h2>
            <p>
              If you mark a track as <strong>public</strong>, the following information may be visible
              to any visitor on MixReflect, including the Weekly Discover page, the 3D Discover
              experience, and the landing page:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Track title and artwork image</li>
              <li>Artist name (from your artist profile)</li>
              <li>Genre tags</li>
              <li>An embedded audio player or link to the external source (SoundCloud, Spotify, YouTube, etc.)</li>
              <li>Public play count</li>
            </ul>
            <p className="mt-3">
              Reviews and detailed feedback are <strong>never</strong> shown publicly. They are only
              visible to the track owner and the reviewer who wrote them. Listening behaviour data
              is only shown to the track owner in aggregate form.
            </p>
          </div>

          {/* ── 4. Third-Party Services ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">4. Third-party services</h2>
            <p>We share data with the following third parties only as needed to operate the service:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Stripe</strong> — payment processing for track submissions, Pro subscriptions, and reviewer payouts via Stripe Connect. Stripe receives your email, payment details, and payout account information.</li>
              <li><strong>Resend</strong> — transactional and announcement emails. Resend receives your email address and name.</li>
              <li><strong>Amazon S3 / Cloudflare R2</strong> — cloud storage for uploaded audio files and artwork. Files are stored securely and served via signed or public URLs.</li>
              <li><strong>Vercel</strong> — hosting and deployment. Vercel processes web requests and may log IP addresses and request metadata.</li>
              <li><strong>Neon</strong> — managed PostgreSQL database hosting. All account, track, review, and behavioural data is stored in Neon&apos;s infrastructure.</li>
              <li><strong>PostHog</strong> — product analytics. PostHog receives anonymised event data about how you interact with the product.</li>
              <li><strong>Microsoft Clarity</strong> (optional) — session replay and heatmaps. If enabled, Clarity captures anonymised interaction recordings.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to any third party.
            </p>
          </div>

          {/* ── 5. Cookies ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">5. Cookies</h2>
            <p>
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Essential cookies</strong> — authentication session tokens (NextAuth). Required for the service to function. Cannot be disabled.</li>
              <li><strong>Analytics cookies</strong> — set by PostHog and optionally Microsoft Clarity to understand product usage. You can control these via your browser settings or opt out through the respective providers.</li>
            </ul>
          </div>

          {/* ── 6. Data Retention ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">6. Data retention</h2>
            <p>
              We retain your account data, track submissions, reviews, and listening behaviour data
              for as long as your account is active. If you delete your account, we will remove your
              personal data within 30 days, except where we are required to retain it for legal,
              financial, or fraud-prevention purposes (e.g. payment records required by tax law).
              Uploaded audio files and artwork are deleted when the associated track is removed.
              Anonymised and aggregated analytics data may be retained indefinitely.
            </p>
          </div>

          {/* ── 7. Data Security ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">7. Data security</h2>
            <p>
              We use industry-standard measures to protect your data, including HTTPS encryption in
              transit, hashed passwords, secure session tokens, and access-controlled cloud storage
              with signed URLs for audio uploads. However, no system is perfectly secure and we
              cannot guarantee absolute security.
            </p>
          </div>

          {/* ── 8. Your Rights ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">8. Your rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — you can request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — you can update your account information, artist profile, and track details at any time.</li>
              <li><strong>Deletion</strong> — you can request deletion of your account and associated data. Some data may be retained as described in section 6.</li>
              <li><strong>Visibility control</strong> — you can change any track between public and private at any time from your track settings, immediately removing it from or adding it to the Discover section.</li>
              <li><strong>Opt out of marketing</strong> — you can unsubscribe from announcement emails at any time. Transactional emails (e.g. review completion, payment receipts) cannot be opted out of while your account is active.</li>
              <li><strong>Data portability</strong> — you can request an export of your reviews and track data in a machine-readable format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us using the details in section 10 below.
            </p>
          </div>

          {/* ── 9. Children ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">9. Children</h2>
            <p>
              MixReflect is not intended for use by anyone under the age of 13. We do not knowingly
              collect personal data from children. If we learn that we have collected data from a
              child under 13, we will delete it promptly.
            </p>
          </div>

          {/* ── 10. Changes & Contact ── */}
          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. If we make material changes, we will
              notify you by email or by posting a notice on the site. Your continued use of
              MixReflect after any changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <div className="border-t-2 border-black pt-6">
            <h2 className="text-xl font-black mb-3">Contact</h2>
            <p>
              For privacy questions or to exercise your data rights, contact us at{" "}
              <a href="mailto:privacy@mixreflect.com" className="underline font-bold">
                privacy@mixreflect.com
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
