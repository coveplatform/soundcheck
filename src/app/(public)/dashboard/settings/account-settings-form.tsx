"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fullSignOut } from "@/lib/full-signout";
import { JetBrains_Mono } from "next/font/google";
import { LogOut } from "lucide-react";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });
const ACCENT = "#6ee7ff";

export function AccountSettingsForm({
  email,
  initialName,
  subscribed,
  isReviewer,
  earnings,
}: {
  email: string;
  initialName: string;
  subscribed: boolean;
  isReviewer: boolean;
  earnings?: { completed: number; cents: number; canPayout: boolean } | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [managing, setManaging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveName = async () => {
    setSavingName(true);
    setNameSaved(false);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      if (res.ok) {
        setNameSaved(true);
        router.refresh();
      }
    } finally {
      setSavingName(false);
    }
  };

  const sendReset = async () => {
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch {
      /* no-op */
    }
  };

  const manageSub = async () => {
    if (managing) return;
    setManaging(true);
    try {
      const res = await fetch("/api/score/portal", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* no-op */
    }
    setManaging(false);
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (res.ok) {
        await fullSignOut("/");
        return;
      }
    } finally {
      setDeleting(false);
    }
  };

  const label = `${mono.className} block text-[12px] text-white/60 mb-2`;
  const input = `${mono.className} w-full bg-[#141414] border border-white/20 focus:border-[#6ee7ff] px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 focus:outline-none transition-colors normal-case`;

  return (
    <div className="space-y-6">
      {/* profile */}
      <section className="border border-white/12 bg-[#101010] p-6">
        <h2 className={`${mono.className} text-[13px] mb-5`} style={{ color: ACCENT }}>profile</h2>

        <div className="mb-5">
          <label className={label}>email</label>
          <p className="text-[15px] text-white/80 normal-case">{email}</p>
        </div>

        <div>
          <label className={label}>display name</label>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => { setName(e.target.value); setNameSaved(false); }} placeholder="your name" className={input} />
            <button
              onClick={saveName}
              disabled={savingName}
              className="bg-[#6ee7ff] text-black font-extrabold text-sm px-5 hover:bg-white transition-colors disabled:opacity-50 shrink-0"
            >
              {savingName ? "…" : nameSaved ? "saved" : "save"}
            </button>
          </div>
        </div>
      </section>

      {/* subscription */}
      <section className="border border-white/12 bg-[#101010] p-6">
        <h2 className={`${mono.className} text-[13px] mb-4`} style={{ color: ACCENT }}>subscription</h2>
        {subscribed ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[14px] text-white/75 normal-case">
              <span style={{ color: ACCENT }}>unlimited</span> · active — every track auto-unlocked.
            </p>
            <button
              onClick={manageSub}
              disabled={managing}
              className={`${mono.className} border border-white/20 hover:border-white/40 text-white text-[13px] px-4 py-2.5 transition-colors disabled:opacity-50`}
            >
              {managing ? "opening…" : "manage / cancel"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[14px] text-white/75 normal-case">
              You&apos;re on pay-per-track ($6.95 each).
            </p>
            <Link href="/#pricing" className="bg-[#6ee7ff] text-black font-extrabold text-[13px] px-4 py-2.5 hover:bg-white transition-colors">
              go unlimited →
            </Link>
          </div>
        )}
      </section>

      {/* reviewer */}
      <section className="border border-white/12 bg-[#101010] p-6">
        <h2 className={`${mono.className} text-[13px] mb-4`} style={{ color: ACCENT }}>reviewing</h2>
        {isReviewer ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-[14px] text-white/75 normal-case">You&apos;re on the listening panel.</p>
              <Link href="/score-review" className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>
                go to your queue →
              </Link>
            </div>
            {earnings && (
              <div className="border-t border-white/10 pt-4 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <p className={`${mono.className} text-[11px] text-white/45 uppercase tracking-wide mb-1`}>your balance</p>
                  <p className="text-3xl font-extrabold" style={{ color: ACCENT }}>
                    ${(earnings.cents / 100).toFixed(2)}
                  </p>
                  <p className={`${mono.className} text-[12px] text-white/45 normal-case mt-1`}>
                    {earnings.completed} review{earnings.completed === 1 ? "" : "s"} · $0.40 each · cash out at $10
                  </p>
                </div>
                <Link
                  href="/score-review"
                  className={`${mono.className} text-[13px] border px-4 py-2.5 transition-colors ${earnings.canPayout ? "hover:bg-white/5" : "opacity-50 pointer-events-none"}`}
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  {earnings.canPayout ? "request payout →" : "keep reviewing →"}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[14px] text-white/75 normal-case">Help other artists — review tracks.</p>
            <Link href="/reviewer" className={`${mono.className} text-[13px]`} style={{ color: ACCENT }}>
              become a reviewer →
            </Link>
          </div>
        )}
      </section>

      {/* security + account */}
      <section className="border border-white/12 bg-[#101010] p-6">
        <h2 className={`${mono.className} text-[13px] mb-4`} style={{ color: ACCENT }}>account</h2>
        <div className="space-y-3">
          <button onClick={sendReset} className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}>
            {resetSent ? "✓ reset link sent to your email" : "send a password reset link →"}
          </button>
          <div>
            <button
              onClick={() => fullSignOut("/")}
              className={`${mono.className} inline-flex items-center gap-2 text-[13px] text-white/65 hover:text-white transition-colors`}
            >
              <LogOut className="h-3.5 w-3.5" /> sign out
            </button>
          </div>
        </div>
      </section>

      {/* help & support */}
      <section className="border border-white/12 bg-[#101010] p-6">
        <h2 className={`${mono.className} text-[13px] mb-4`} style={{ color: ACCENT }}>help &amp; support</h2>
        <p className="text-[14px] text-white/75 normal-case mb-4 leading-relaxed">
          Stuck on something, or have a question about your account, a report, or your balance?
          We&apos;re here — we usually reply within a day.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="mailto:support@mixreflect.com"
            className="bg-[#6ee7ff] text-black font-extrabold text-[13px] px-4 py-2.5 hover:bg-white transition-colors"
          >
            email support →
          </a>
          <Link
            href="/support"
            className={`${mono.className} text-[13px] text-white/65 hover:text-white transition-colors`}
          >
            visit the help page
          </Link>
        </div>
      </section>

      {/* danger */}
      <section className="border border-red-500/20 bg-[#140d0d] p-6">
        <h2 className={`${mono.className} text-[13px] text-red-400 mb-3`}>danger zone</h2>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className={`${mono.className} text-[13px] text-red-400/80 hover:text-red-400 transition-colors`}>
            delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-white/70 normal-case">This permanently deletes your account and reports. This can&apos;t be undone.</p>
            <div className="flex gap-2">
              <button onClick={deleteAccount} disabled={deleting} className="bg-red-500 text-white font-bold text-[13px] px-4 py-2.5 hover:bg-red-400 transition-colors disabled:opacity-50">
                {deleting ? "deleting…" : "yes, delete everything"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className={`${mono.className} text-[13px] text-white/55 hover:text-white px-4 py-2.5`}>
                cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
