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
              On March 13, 2026, a database migration error caused the loss of all user account data on MixReflect. Every account, track, review, and credit balance was affected. We take full responsibility for this and are deeply sorry.
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
                "All subscription records",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">If you had a Pro subscription</h2>
            <p className="text-base leading-relaxed mb-4">
              Sign up again with any email address, then contact us at{" "}
              <a href="mailto:support@mixreflect.com" className="font-bold text-purple-600 underline underline-offset-2">
                support@mixreflect.com
              </a>
              . We will transfer your Pro subscription to your new account at no charge, and add a free month on top as an apology. We are also reaching out directly to known subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">For all returning users</h2>
            <p className="text-base leading-relaxed mb-4">
              If you had a free account, sign up again and email us — we will credit your new account with <span className="font-bold text-neutral-900">10 free credits</span> to get you back up and running straight away.
            </p>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">What we have done to prevent this</h2>
            <ul className="space-y-2 text-base leading-relaxed list-none">
              {[
                "Automated daily database backups are now active.",
                "Database migrations now require a verified backup before they can run.",
                "We are reviewing our full deployment process to add additional safeguards.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-lime-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">Our apology</h2>
            <p className="text-base leading-relaxed">
              Losing your data — your tracks, your feedback, your work — is the worst thing we could do as a platform. We are sorry. We understand if this has shaken your confidence in MixReflect, and we will earn that trust back through our actions.
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
