"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Eye, Loader2, AlertTriangle, CheckCircle2, Users, Mail, Clock, Gift } from "lucide-react";

interface LapsedUser {
  email: string;
  name: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export default function RecapturePage() {
  const [previewHtml, setPreviewHtml] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [lapsedUsers, setLapsedUsers] = useState<LapsedUser[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendingTestKris, setSendingTestKris] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testKrisResult, setTestKrisResult] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; failedEmails?: string[] } | null>(null);
  const [confirmSendAll, setConfirmSendAll] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/recapture").then((r) => r.text()),
      fetch("/api/admin/recapture?action=count").then((r) => r.json()),
    ]).then(([html, data]) => {
      setPreviewHtml(html);
      setCount(data.count ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadList = async () => {
    if (lapsedUsers.length > 0) { setShowList((v) => !v); return; }
    const data = await fetch("/api/admin/recapture?action=list").then((r) => r.json());
    setLapsedUsers(data.users ?? []);
    setShowList(true);
  };

  const sendTest = async () => {
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/recapture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: true }),
      });
      const data = await res.json();
      setTestResult(data.success ? "Test email sent to your inbox!" : `Failed: ${data.error}`);
    } catch {
      setTestResult("Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  const sendTestToKris = async () => {
    setSendingTestKris(true);
    setTestKrisResult(null);
    try {
      const res = await fetch("/api/admin/recapture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: "kris.engelhardt4@gmail.com" }),
      });
      const data = await res.json();
      setTestKrisResult(data.success ? "Test sent to kris.engelhardt4@gmail.com!" : `Failed: ${data.error}`);
    } catch {
      setTestKrisResult("Failed to send test email");
    } finally {
      setSendingTestKris(false);
    }
  };

  const sendToAll = async () => {
    setSendingAll(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/recapture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: false }),
      });
      const data = await res.json();
      setResult({ sent: data.sent, failed: data.failed, total: data.total, failedEmails: data.failedEmails || [] });
    } catch {
      setResult({ sent: 0, failed: 1, total: 0 });
    } finally {
      setSendingAll(false);
      setConfirmSendAll(false);
    }
  };

  const formatLastActive = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "Yesterday";
    return `${daysAgo}d ago`;
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#6ee7ff] mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-[#f4f4ef] lowercase">win-back campaign</h1>
            <p className="text-sm text-white/45 mt-1">
              Send a recapture email to users who haven&apos;t been active in 7+ days — includes 5 free credits, added automatically.
            </p>
          </div>
          {count !== null && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-lg flex-shrink-0 ml-4">
              <Users className="h-4 w-4 text-white/40" />
              <span className="text-sm font-semibold text-white/70">{count} lapsed users</span>
            </div>
          )}
        </div>

        {/* Credits note */}
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-6">
          <Gift className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-800 font-medium">
            Sending to all will add <strong>5 review credits</strong> to every lapsed user&apos;s account before the emails go out — no code required on their end.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={sendTest}
            disabled={sending}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Send Test to Me
          </button>

          <button
            onClick={sendTestToKris}
            disabled={sendingTestKris}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sendingTestKris ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send Test to Kris
          </button>

          {!confirmSendAll ? (
            <button
              onClick={() => setConfirmSendAll(true)}
              disabled={sendingAll || result !== null}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send + Add Credits ({count ?? "..."})
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  This will add 5 credits + email {count} users. Sure?
                </span>
              </div>
              <button
                onClick={sendToAll}
                disabled={sendingAll}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {sendingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sendingAll ? "Sending..." : "Yes, Send Now"}
              </button>
              <button
                onClick={() => setConfirmSendAll(false)}
                className="h-10 px-3 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={loadList}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
          >
            <Clock className="h-4 w-4" />
            {showList ? "Hide list" : "View list"}
          </button>
        </div>

        {/* Status messages */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${testResult.includes("sent") || testResult.includes("Test") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            <CheckCircle2 className="h-4 w-4" />
            {testResult}
          </div>
        )}
        {testKrisResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${testKrisResult.includes("sent") || testKrisResult.includes("Test") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            <CheckCircle2 className="h-4 w-4" />
            {testKrisResult}
          </div>
        )}

        {result && (
          <div className="mb-4 space-y-2">
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${result.failed === 0 ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
              <CheckCircle2 className="h-4 w-4" />
              Sent {result.sent} of {result.total} emails{result.failed > 0 ? ` (${result.failed} failed)` : ""} · 5 credits added to all accounts
            </div>
            {result.failedEmails && result.failedEmails.length > 0 && (
              <div className="border border-red-200 rounded-lg bg-red-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Failed emails ({result.failedEmails.length})</p>
                  <button
                    onClick={async () => {
                      setSendingAll(true);
                      try {
                        const res = await fetch("/api/admin/recapture", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ retryEmails: result.failedEmails }),
                        });
                        const data = await res.json();
                        setResult({ sent: result.sent + data.sent, failed: data.failed, total: result.total, failedEmails: data.failedEmails || [] });
                      } finally {
                        setSendingAll(false);
                      }
                    }}
                    disabled={sendingAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 bg-white border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    {sendingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Retry Failed
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.failedEmails.map((email, i) => (
                    <div key={i} className="text-sm text-red-800 font-mono bg-white/60 px-2 py-1 rounded">{email}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lapsed user list */}
        {showList && lapsedUsers.length > 0 && (
          <div className="mb-6 border border-neutral-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Lapsed Users ({lapsedUsers.length})</span>
            </div>
            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
              {lapsedUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">{u.email}</div>
                    {u.name && <div className="text-xs text-neutral-400">{u.name}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="text-xs text-neutral-400 font-mono">{formatLastActive(u.lastActiveAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email preview */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Email Preview</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : (
            <iframe
              srcDoc={previewHtml}
              className="w-full border-0"
              style={{ height: "860px" }}
              title="Email preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
