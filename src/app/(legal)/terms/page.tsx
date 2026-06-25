import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using MixReflect — getting a release verdict on your track and sending it to a room of real listeners. Your rights and responsibilities.",
  alternates: { canonical: "/terms" },
};

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export default function TermsPage() {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef] selection:bg-[#6ee7ff] selection:text-black`}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
          </Link>
          <Link href="/" className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
            ← back
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-14">
        <p className={`${mono.className} text-[13px] text-white/55 mb-3 lowercase`}>[ legal ]</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] lowercase">
          terms of <span style={{ color: ACCENT }}>service</span>.
        </h1>
        <p className={`${mono.className} text-[12px] text-white/40 mt-4`}>Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 space-y-10 text-white/60 leading-7 text-[15px]">
          <p>
            MixReflect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a music feedback service.
            Artists submit a track and receive an instant AI-generated read — a score, verdict and
            breakdown — plus honest reactions from a panel of real, paid listeners. MixReflect is
            operated by MixReflect, based in Melbourne, Victoria, Australia. By creating an account
            or using MixReflect, you agree to these terms.
          </p>

          {/* ── 1. Accounts ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">1. accounts and profiles</h2>
            <p>
              You must provide accurate information when creating your account. You are responsible
              for keeping your login credentials secure. Artists create an account to submit tracks
              and view reports. Listeners may additionally opt in to the paid listening panel, which
              requires payout details to receive earnings.
            </p>
          </div>

          {/* ── 2. Track Submissions ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">2. track submissions</h2>
            <p>
              You submit tracks by providing a link (SoundCloud, YouTube, etc.) or by uploading an
              audio file directly. Submitting a track is free. Each submission is processed by
              automated analysis (including third-party AI services) to generate your score report,
              and may be played to members of our paid listening panel who provide reactions.
            </p>
            <h3 className="font-bold text-white/85 mt-4 mb-1">Visibility</h3>
            <p>
              Tracks you submit and the reports generated for them are private to you and the
              listeners assigned to your track. If a track is featured in any public section of the
              site (for example a demo or discovery feature), this only happens for tracks marked
              public, and you can change a track&apos;s visibility at any time.
            </p>
            <h3 className="font-bold text-white/85 mt-4 mb-1">Legacy service (MixReflect Classic)</h3>
            <p>
              Accounts created on the previous peer-to-peer version of MixReflect (&quot;MixReflect
              Classic&quot;) remain subject to its mechanics while it is wound down, including review
              credits and active-slot limits (1 slot free, 3 slots for Pro subscribers).
            </p>
          </div>

          {/* ── 3. Listener reactions ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">3. listener reactions and feedback</h2>
            <p>
              Panel listeners must listen to a track before reacting and agree to provide honest,
              constructive, specific feedback. Low-quality or fraudulent reactions may be flagged,
              removed, and unpaid. AI-generated analysis is an automated opinion, not a guarantee of
              quality or commercial outcome.
            </p>
            <p className="mt-3">
              While listening, behavioural signals (play, pause, seek, volume, tab focus) may be
              passively captured to improve feedback quality and provide artists with aggregate
              engagement insights. This data is never shared publicly.
            </p>
          </div>

          {/* ── 4. Payments ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">4. payments</h2>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Report unlocks</h3>
            <p>
              Submitting a track is free. Your first track&apos;s full report is free (one per
              account, lifetime); reports for later tracks display in sealed form until unlocked.
              Unlocking a track&apos;s full report is a one-time purchase ($6.95 at the time of
              writing) processed via Stripe Checkout. Prices are displayed at checkout. You are
              responsible for any taxes required by your jurisdiction.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Unlimited subscription</h3>
            <p>
              The Unlimited plan ($19.95/month or $143.40/year at the time of writing) automatically
              unlocks every track you submit, subject to the fair-use limits shown on the pricing
              page. Subscriptions auto-renew unless cancelled. You can manage your subscription and
              billing through the Stripe Customer Portal. If you cancel, access continues until the
              end of the paid period and reports you have unlocked remain yours.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Listener earnings</h3>
            <p>
              Panel listeners earn the per-reaction rate shown on the listener page. Earnings accrue
              as a balance and can be withdrawn once the payout threshold ($10) is reached. Payout
              requests are reviewed and processed by our team, subject to fraud review. We are not
              responsible for payment processors&apos; fees or schedules.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Legacy credits and Pro subscriptions</h3>
            <p>
              Credits and Pro subscriptions purchased on MixReflect Classic continue to be honoured
              while the legacy service is wound down, and remain manageable through the Stripe
              Customer Portal.
            </p>
          </div>

          {/* ── 5. Refund Policy ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">5. refund policy</h2>
            <p>
              Report unlocks are digital purchases delivered immediately, so they are generally
              non-refundable once the full report has been opened. Subscription renewals can be
              cancelled any time before the next billing date. Refund requests are handled by
              support on a case-by-case basis.
            </p>
          </div>

          {/* ── 6. Content Ownership ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">6. content ownership</h2>
            <p>
              You retain full ownership of your music and any content you submit to MixReflect. By
              submitting a track, you grant MixReflect a limited, non-exclusive licence to access,
              stream, and process the track — including automated and AI analysis — solely for the
              purpose of generating your report, and grant assigned listeners access solely for the
              purpose of providing feedback. This licence terminates when you delete the track.
            </p>
            <p className="mt-3">
              Reaction content (text, ratings) is licensed to MixReflect and the track owner for use
              within the platform, including in your score report.
            </p>
          </div>

          {/* ── 7. Prohibited Conduct ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">7. prohibited conduct</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Submitting tracks you do not own or have rights to share.</li>
              <li>Submitting fraudulent, plagiarised, or deliberately low-quality reactions.</li>
              <li>Attempting to manipulate scores, the listening panel, or the rating system.</li>
              <li>Creating multiple accounts to circumvent limits or other restrictions.</li>
              <li>Harassing, threatening, or abusing other users via reactions, notes, or support.</li>
              <li>Uploading malicious files or attempting to exploit the platform technically.</li>
            </ul>
            <p className="mt-3">
              Violation of these terms may result in account suspension or termination at our
              discretion.
            </p>
          </div>

          {/* ── 8. Liability ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">8. limitation of liability</h2>
            <p>
              MixReflect is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
              do not guarantee a specific outcome, placement, or commercial results from feedback or
              scores. We do not guarantee the accuracy, quality, or usefulness of any reaction or
              AI-generated analysis. To the maximum extent permitted by law, MixReflect shall not be
              liable for any indirect, incidental, or consequential damages arising from your use of
              the service.
            </p>
          </div>

          {/* ── 9. Termination ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">9. termination</h2>
            <p>
              You may delete your account at any time. We may suspend or terminate your account if
              you violate these terms. On termination, your personal data will be handled as
              described in our{" "}
              <Link href="/privacy" className="font-bold hover:text-white transition-colors" style={{ color: ACCENT }}>Privacy Policy</Link>.
              Outstanding listener balances will be paid out subject to fraud review.
            </p>
          </div>

          {/* ── 10. Changes ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">10. changes to these terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated
              via email or an in-app notice. Continued use of MixReflect after changes constitutes
              acceptance of the updated terms.
            </p>
          </div>

          {/* ── 11. Governing Law ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">11. governing law</h2>
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
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">contact</h2>
            <p>
              For support and policy questions, contact us at{" "}
              <a href="mailto:support@mixreflect.com" className="font-bold hover:text-white transition-colors" style={{ color: ACCENT }}>
                support@mixreflect.com
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-6">
        <div className={`${mono.className} max-w-3xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40 lowercase`}>
          <Link href="/">
            <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-6" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">privacy</Link>
            <Link href="/support" className="hover:text-white transition-colors">contact</Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
