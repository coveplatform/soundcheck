import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "Service Incident — March 13, 2026 | MixReflect",
  description: "Information about the MixReflect database incident on March 13, 2026.",
};

export default function IncidentPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="mb-8">
          <span className="inline-block bg-red-100 text-red-700 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Incident Report
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 leading-tight">
            Database Incident<br />March 13, 2026
          </h1>
        </div>

        <div className="space-y-8 text-neutral-700">

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">What happened</h2>
            <p className="text-base leading-relaxed">
              On March 13, 2026, a database migration error resulted in the loss of all user account data on MixReflect. This affected all 245 registered users — including track submissions, reviews, credits, and account profiles. We have no backup from before the incident.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">What was lost</h2>
            <ul className="space-y-2 text-base leading-relaxed list-none">
              {[
                "All user accounts and profiles",
                "All submitted tracks and associated artwork",
                "All reviews and feedback received",
                "All credits earned and spent",
                "All subscription and payment history",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">What we&apos;re doing</h2>
            <ul className="space-y-2 text-base leading-relaxed list-none">
              {[
                "All paying subscribers will receive a full refund for the current billing period — no action needed on your part.",
                "Automated database backups are now in place to prevent this happening again.",
                "We are reviewing our deployment process to ensure migrations cannot be run without a verified backup.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lime-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">If you were a subscriber</h2>
            <p className="text-base leading-relaxed">
              If you had an active Pro subscription, please email us at{" "}
              <a href="mailto:support@mixreflect.com" className="font-bold text-purple-600 underline underline-offset-2">
                support@mixreflect.com
              </a>{" "}
              and we will process your refund immediately. We are also contacting known subscribers directly.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Our apology</h2>
            <p className="text-base leading-relaxed">
              We are genuinely sorry. Losing your data is the worst outcome we could cause as a platform, and we take full responsibility. We understand if this has broken your trust in MixReflect. For those who choose to return, we are committed to ensuring this never happens again.
            </p>
          </section>

          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <p className="text-sm text-neutral-400">Last updated: March 13, 2026</p>
            <Link
              href="/signup"
              className="text-sm font-black text-purple-600 hover:text-purple-700 underline underline-offset-2 transition-colors"
            >
              Create a new account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
