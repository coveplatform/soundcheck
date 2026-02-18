"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Eye, Loader2, AlertTriangle, CheckCircle2, Users } from "lucide-react";

export default function AnnouncementPage() {
  const [previewHtml, setPreviewHtml] = useState("");
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [confirmSendAll, setConfirmSendAll] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/send-announcement").then((r) => r.text()),
      fetch("/api/admin/send-announcement?action=count").then((r) => r.json()),
    ]).then(([html, data]) => {
      setPreviewHtml(html);
      setUserCount(data.count ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sendTest = async () => {
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/send-announcement", {
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

  const sendToAll = async () => {
    setSendingAll(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: false }),
      });
      const data = await res.json();
      setResult({ sent: data.sent, failed: data.failed, total: data.total });
    } catch {
      setResult({ sent: 0, failed: 1, total: 0 });
    } finally {
      setSendingAll(false);
      setConfirmSendAll(false);
    }
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Send Announcement</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Preview and send the feature announcement to all real users
            </p>
          </div>
          {userCount !== null && (
            <div className="flex items-center gap-2 bg-neutral-100 px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-700">{userCount} recipients</span>
            </div>
          )}
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

          {!confirmSendAll ? (
            <button
              onClick={() => setConfirmSendAll(true)}
              disabled={sendingAll || result !== null}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send to All Users ({userCount ?? "..."})
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  This will email {userCount} real users. Are you sure?
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
        </div>

        {/* Status messages */}
        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${
            testResult.includes("sent") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            <CheckCircle2 className="h-4 w-4" />
            {testResult}
          </div>
        )}

        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm font-medium ${
            result.failed === 0 ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}>
            <CheckCircle2 className="h-4 w-4" />
            Sent {result.sent} of {result.total} emails{result.failed > 0 ? ` (${result.failed} failed)` : ""}
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
              style={{ height: "800px" }}
              title="Email preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
