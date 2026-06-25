import Link from "next/link";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Logo } from "@/components/ui/logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MixReflect handles your data when you get a release verdict on your track and send it to a room of real listeners. What we collect, why, and your rights.",
  alternates: { canonical: "/privacy" },
};

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export default function PrivacyPage() {
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
          privacy <span style={{ color: ACCENT }}>policy</span>.
        </h1>
        <p className={`${mono.className} text-[12px] text-white/40 mt-4`}>Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 space-y-10 text-white/60 leading-7 text-[15px]">
          <p>
            This policy describes how MixReflect (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores,
            and shares information when you use our music feedback service. By creating an
            account or using MixReflect, you agree to the practices described here.
          </p>
          <p>
            MixReflect is operated by MixReflect, based in Melbourne, Victoria, Australia. For
            privacy enquiries, contact us at{" "}
            <a href="mailto:privacy@mixreflect.com" className="font-bold hover:text-white transition-colors" style={{ color: ACCENT }}>
              privacy@mixreflect.com
            </a>
            .
          </p>

          {/* ── 1. Data We Collect ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">1. data we collect</h2>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Account information</h3>
            <p>
              When you sign up we collect your name, email address, and a hashed password (or OAuth
              credentials if you sign in via a third-party provider). If you create an artist
              profile we also store your artist name, genre preferences, and optional bio.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Track submissions</h3>
            <p>
              When you submit a track we store the track title, artist note, genre tags, source URL
              or link (e.g. SoundCloud, Spotify, YouTube), and any uploaded audio file. If you
              upload an MP3 or WAV file directly, the file is stored in cloud object storage
              (Amazon S3 or Cloudflare R2). We also store artwork images, either uploaded by you or
              fetched automatically from the linked platform via oEmbed.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">AI analysis</h3>
            <p>
              When you submit a track for a score report, the track&apos;s audio and metadata are
              processed by automated analysis systems, including third-party AI services, to
              generate your score, verdict, and written read. The resulting report is stored with
              your account. We may also derive an audio fingerprint of the track so that re-uploads
              of the same track can be recognised.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Public vs. private tracks</h3>
            <p>
              Tracks and reports are private to you and the listeners assigned to your track unless
              a track is marked <strong>public</strong>. Public tracks may appear in discovery
              sections of the site, visible to all visitors — including your track title, artist
              name, artwork, genre tags, and an embedded player or link to the audio source. You can
              change a track&apos;s visibility at any time.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Reactions and feedback</h3>
            <p>
              We store the full content of every listener reaction and review, including structured
              ratings, free-text feedback, timestamp annotations, and technical issue flags.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Listening behavior data</h3>
            <p>
              While a listener plays a track, we passively capture behavioural signals from the
              audio player to improve feedback quality. This includes play, pause, and seek events;
              volume changes; replay and skip zones; tab focus/blur events; and the overall
              engagement curve. This data is used to compute metrics such as completion rate,
              attention score, and behavioural-explicit alignment (how well the listener&apos;s
              listening patterns match their written feedback). Listening behaviour data is
              associated with the reaction, not the listener&apos;s broader account, and is presented
              to artists only in aggregate across all listeners for a given track.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Payment and payout information</h3>
            <p>
              We store transaction metadata (product purchased, amount, currency, Stripe session and
              payment IDs) to track order status. For listener payouts we store payout details,
              accrued balances, and payout history. We do not store full credit card numbers or bank
              account details — those are held by Stripe.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Subscription data</h3>
            <p>
              If you subscribe to the Unlimited plan (or hold a legacy MixReflect Pro subscription)
              we store your Stripe customer ID, subscription ID, and subscription status to manage
              your plan and billing.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Usage and analytics</h3>
            <p>
              We use PostHog for product analytics and may optionally use Microsoft Clarity for
              session replays. These tools collect anonymised interaction data such as page views,
              clicks, scroll depth, and device information. We also use TikTok Pixel and Reddit
              Pixel to measure the performance of our advertising campaigns. These tools are only
              activated with your consent — see section 5 below. Public play counts on tracks are
              also recorded.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Support tickets</h3>
            <p>
              If you contact support, we store the subject, message body, and any follow-up messages
              to resolve your request.
            </p>

            <h3 className="font-bold text-white/85 mt-4 mb-1">Cookies and session data</h3>
            <p>
              We use cookies to authenticate your session (via NextAuth) and to remember your
              preferences. Authentication cookies are essential for the service to function.
              Analytics and advertising tools may set their own cookies only after you give consent
              — see section 5 below.
            </p>
          </div>

          {/* ── 2. How We Use Your Data ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">2. how we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Authenticate you and manage your account and profiles.</li>
              <li>Generate AI score reports — your track&apos;s audio and metadata are processed by automated analysis, including third-party AI services, to produce your score, verdict, and written read.</li>
              <li>Assign tracks to members of the paid listening panel and manage the claim pool.</li>
              <li>Process payments for report unlocks and subscriptions, and listener payouts, via Stripe.</li>
              <li>Display public tracks, artwork, and artist names in discovery sections of the site.</li>
              <li>Compute feedback quality scores (text specificity, actionability, technical depth) to surface higher-quality reactions.</li>
              <li>Analyse listening behaviour to provide artists with aggregate engagement insights (replay hotspots, drop-off points, attention curves).</li>
              <li>Generate automated feedback synthesis that combines multiple reactions into actionable summaries.</li>
              <li>Send transactional emails (report-ready notifications, payment receipts, account verification) via Resend.</li>
              <li>Send optional announcement or marketing emails (you can unsubscribe at any time).</li>
              <li>Detect and prevent abuse, fraud, and low-quality reactions.</li>
              <li>Improve product quality through analytics and aggregated usage patterns.</li>
              <li>Manage subscription entitlements, and legacy Classic mechanics (credits and slot limits) during the wind-down.</li>
              <li>Measure the effectiveness of advertising campaigns on TikTok and Reddit (only with your consent).</li>
            </ul>
          </div>

          {/* ── 3. What We Share Publicly ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">3. what we share publicly</h2>
            <p>
              If you mark a track as <strong>public</strong>, the following information may be visible
              to any visitor on MixReflect in discovery sections of the site:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Track title and artwork image</li>
              <li>Artist name (from your artist profile)</li>
              <li>Genre tags</li>
              <li>An embedded audio player or link to the external source (SoundCloud, Spotify, YouTube, etc.)</li>
              <li>Public play count</li>
            </ul>
            <p className="mt-3">
              Score reports, reactions, and detailed feedback are <strong>never</strong> shown
              publicly unless you choose to share your report link. Listening behaviour data is only
              shown to the track owner in aggregate form.
            </p>
          </div>

          {/* ── 4. Third-Party Services ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">4. third-party services</h2>
            <p>We share data with the following third parties only as needed to operate the service:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Anthropic</strong> — AI analysis. Your track&apos;s audio characteristics and metadata are processed to generate your score report&apos;s written read.</li>
              <li><strong>Stripe</strong> — payment processing for report unlocks, subscriptions, and payouts. Stripe receives your email, payment details, and payout account information.</li>
              <li><strong>Resend</strong> — transactional and announcement emails. Resend receives your email address and name.</li>
              <li><strong>Amazon S3 / Cloudflare R2</strong> — cloud storage for uploaded audio files and artwork. Files are stored securely and served via signed or public URLs.</li>
              <li><strong>Vercel</strong> — hosting and deployment. Vercel processes web requests and may log IP addresses and request metadata.</li>
              <li><strong>Neon</strong> — managed PostgreSQL database hosting. All account, track, report, reaction, and behavioural data is stored in Neon&apos;s infrastructure.</li>
              <li><strong>PostHog</strong> — product analytics. PostHog receives anonymised event data about how you interact with the product. Activated only with your consent.</li>
              <li><strong>Microsoft Clarity</strong> (optional) — session replay and heatmaps. If enabled, Clarity captures anonymised interaction recordings. Activated only with your consent.</li>
              <li><strong>TikTok Pixel</strong> — advertising measurement. If you consent to analytics cookies, the TikTok Pixel fires on page load and sends anonymised event data (page views, conversions) to TikTok to measure the performance of our ads. TikTok may use this data in accordance with their own privacy policy. No personal data you enter on MixReflect is sent to TikTok.</li>
              <li><strong>Reddit Pixel</strong> — advertising measurement. If you consent to analytics cookies, the Reddit Pixel fires on page load and sends anonymised event data (page views, conversions) to Reddit to measure the performance of our ads. Reddit may use this data in accordance with their own privacy policy. No personal data you enter on MixReflect is sent to Reddit.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to any third party.
            </p>
          </div>

          {/* ── 5. Cookies and Consent ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">5. cookies and consent</h2>
            <p>
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Essential cookies</strong> — authentication session tokens (NextAuth).
                Required for the service to function. Set immediately on login and cannot be
                disabled without logging out.
              </li>
              <li>
                <strong>Analytics cookies</strong> — set by PostHog and optionally Microsoft
                Clarity to understand product usage. These are only set after you accept cookies
                via the consent banner.
              </li>
              <li>
                <strong>Advertising cookies</strong> — set by TikTok Pixel and Reddit Pixel to
                measure advertising campaign performance. These are only set after you accept
                cookies via the consent banner. If you decline, these scripts are never loaded.
              </li>
            </ul>
            <p className="mt-3">
              When you first visit MixReflect, a banner will ask for your consent to set
              non-essential cookies. You can decline and the service will still work fully —
              only the authentication cookie will be set. You can change your preference at any
              time by clearing your browser&apos;s local storage for mixreflect.com.
            </p>
          </div>

          {/* ── 6. Lawful Basis for Processing ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">6. lawful basis for processing</h2>
            <p>
              Where the General Data Protection Regulation (GDPR) applies (including for users in
              the European Economic Area and United Kingdom), we process your personal data on the
              following legal bases:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Performance of a contract</strong> — account data, track submissions, AI analysis, reaction data, payment and subscription data, and transactional emails are processed to fulfil our agreement with you when you use MixReflect.</li>
              <li><strong>Legal obligation</strong> — payment records and related data may be retained to comply with financial and tax regulations.</li>
              <li><strong>Legitimate interests</strong> — listening behaviour analytics (presented only in aggregate to track owners), fraud detection, abuse prevention, and product improvement through anonymised usage data. We have assessed that these interests are not overridden by your data protection rights.</li>
              <li><strong>Consent</strong> — advertising pixels (TikTok, Reddit), session replay (Microsoft Clarity), product analytics (PostHog), and marketing emails. You can withdraw consent at any time — for cookies by clearing your consent preference in browser local storage, and for marketing emails by unsubscribing via the link in any email.</li>
            </ul>
            <p className="mt-3">
              MixReflect is also subject to the Australian Privacy Act 1988 and the Australian
              Privacy Principles (APPs). Users in Australia have the right to access, correct, and
              complain about the handling of their personal information.
            </p>
          </div>

          {/* ── 7. Data Retention ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">7. data retention</h2>
            <p>
              We retain your account data, track submissions, reports, reactions, and listening
              behaviour data for as long as your account is active. If you delete your account, we
              will remove your personal data within 30 days, except where we are required to retain
              it for legal, financial, or fraud-prevention purposes (e.g. payment records required
              by tax law). Uploaded audio files and artwork are deleted when the associated track is
              removed. Anonymised and aggregated analytics data may be retained indefinitely.
            </p>
          </div>

          {/* ── 8. Data Security ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">8. data security</h2>
            <p>
              We use industry-standard measures to protect your data, including HTTPS encryption in
              transit, hashed passwords, secure session tokens, and access-controlled cloud storage
              with signed URLs for audio uploads. However, no system is perfectly secure and we
              cannot guarantee absolute security.
            </p>
          </div>

          {/* ── 9. Your Rights ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">9. your rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — you can request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — you can update your account information, artist profile, and track details at any time.</li>
              <li><strong>Deletion</strong> — you can request deletion of your account and associated data. Some data may be retained as described in section 7.</li>
              <li><strong>Visibility control</strong> — you can change any track between public and private at any time, immediately removing it from or adding it to discovery sections.</li>
              <li><strong>Opt out of marketing</strong> — you can unsubscribe from announcement emails at any time. Transactional emails (e.g. report-ready notifications, payment receipts) cannot be opted out of while your account is active.</li>
              <li><strong>Data portability</strong> — you can request an export of your reports and track data in a machine-readable format.</li>
              <li><strong>Withdraw consent</strong> — where we process data based on your consent, you can withdraw it at any time without affecting the lawfulness of processing before withdrawal.</li>
              <li><strong>Object to processing</strong> — you can object to processing based on legitimate interests. We will stop unless we have compelling legitimate grounds.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us using the details in the Contact section below.
              If you are in the EEA or UK and are unsatisfied with our response, you have the right
              to lodge a complaint with your local data protection authority. If you are in Australia,
              you may contact the Office of the Australian Information Commissioner (OAIC).
            </p>
          </div>

          {/* ── 10. Children ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">10. children</h2>
            <p>
              MixReflect is not intended for use by anyone under the age of 13. We do not knowingly
              collect personal data from children. If we learn that we have collected data from a
              child under 13, we will delete it promptly.
            </p>
          </div>

          {/* ── 11. Governing Law ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">11. governing law</h2>
            <p>
              This Privacy Policy is governed by the laws of Victoria, Australia. Any disputes
              relating to this policy that cannot be resolved informally will be subject to the
              exclusive jurisdiction of the courts of Victoria, Australia.
            </p>
            <p className="mt-3">
              Where you access MixReflect from the European Economic Area or the United Kingdom,
              the General Data Protection Regulation (GDPR) or UK GDPR also applies to the
              processing of your personal data, in addition to Australian law.
            </p>
          </div>

          {/* ── 12. Changes to this policy ── */}
          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">12. changes to this policy</h2>
            <p>
              We may update this policy from time to time. If we make material changes, we will
              notify you by email or by posting a notice on the site. Your continued use of
              MixReflect after any changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-extrabold tracking-tight text-white mb-3 lowercase">contact</h2>
            <p>
              For privacy questions or to exercise your data rights, contact us at{" "}
              <a href="mailto:privacy@mixreflect.com" className="font-bold hover:text-white transition-colors" style={{ color: ACCENT }}>
                privacy@mixreflect.com
              </a>
              .
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
            <Link href="/terms" className="hover:text-white transition-colors">terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">contact</Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
