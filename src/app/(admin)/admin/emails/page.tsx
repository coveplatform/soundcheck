"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Eye, Loader2, CheckCircle2, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMAIL_TYPES = [
  { id: "track-queued", name: "Track Queued", description: "Sent when artist's track enters the review queue", category: "Artist" },
  { id: "review-progress", name: "Review Progress (50%)", description: "Sent at 50% review completion", category: "Artist" },
  { id: "reviews-complete", name: "Reviews Complete (100%)", description: "Sent when all reviews are done", category: "Artist" },
  { id: "release-decision-report", name: "Release Decision Report", description: "Full report with verdict, score, and fixes", category: "Artist" },
  { id: "invalid-track", name: "Invalid Track Link", description: "Sent when track URL is broken/private", category: "Artist" },
  { id: "purchase-confirmation", name: "Purchase Confirmation", description: "Sent after track purchase with download link", category: "Artist" },
  { id: "trial-reminder", name: "Trial Reminder", description: "Nudge to submit first track", category: "Marketing" },
  { id: "lead-reminder", name: "Lead Reminder", description: "Nudge to finish signing up", category: "Marketing" },
  { id: "finish-later", name: "Finish Later", description: "Resume link for mobile users", category: "Marketing" },
  { id: "tier-change", name: "Tier Change", description: "Reviewer promoted to new tier", category: "Reviewer" },
  { id: "password-reset", name: "Password Reset", description: "Password reset link", category: "Auth" },
  { id: "admin-new-track", name: "Admin: New Track", description: "Admin notification for new submission", category: "Admin" },
];

const CATEGORIES = ["Artist", "Marketing", "Reviewer", "Auth", "Admin"];

export default function AdminEmailsPage() {
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  const loadPreview = async (type: string) => {
    if (previewType === type) {
      setPreviewType(null);
      return;
    }
    setLoadingPreview(true);
    setPreviewType(type);
    try {
      const res = await fetch(`/api/admin/test-email?type=${type}`);
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml("<p>Failed to load preview</p>");
    } finally {
      setLoadingPreview(false);
    }
  };

  const sendTest = async (type: string) => {
    setSendingType(type);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type, success: true, message: `Sent to ${data.sentTo}` });
      } else {
        setResult({ type, success: false, message: data.error || "Failed" });
      }
    } catch {
      setResult({ type, success: false, message: "Network error" });
    } finally {
      setSendingType(null);
    }
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-neutral-900 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Email Templates</h1>
            <p className="text-sm text-neutral-500">Preview and test-send all {EMAIL_TYPES.length} email templates</p>
          </div>
        </div>

        {result && (
          <div className={`mt-4 mb-6 rounded-xl border-2 p-4 flex items-center gap-3 ${result.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            {result.success ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-red-500" />}
            <p className={`text-sm font-medium ${result.success ? "text-emerald-800" : "text-red-700"}`}>
              <strong>{EMAIL_TYPES.find((t) => t.id === result.type)?.name}:</strong> {result.message}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-8">
          {CATEGORIES.map((category) => {
            const emails = EMAIL_TYPES.filter((e) => e.category === category);
            if (emails.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400 mb-3">{category}</h2>
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div key={email.id}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-neutral-900">{email.name}</h3>
                          <p className="text-xs text-neutral-500 mt-0.5">{email.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadPreview(email.id)}
                            className="text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1.5" />
                            {previewType === email.id ? "Hide" : "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => sendTest(email.id)}
                            disabled={sendingType === email.id}
                            className="text-xs h-8 bg-neutral-900 text-white hover:bg-neutral-800"
                          >
                            {sendingType === email.id ? (
                              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3 mr-1.5" />
                            )}
                            Send Test
                          </Button>
                        </div>
                      </div>

                      {previewType === email.id && (
                        <div className="mt-2 mb-4 rounded-xl border-2 border-purple-200 overflow-hidden">
                          <div className="bg-purple-50 px-4 py-2 border-b border-purple-200 flex items-center justify-between">
                            <span className="text-xs font-semibold text-purple-700">Email Preview — {email.name}</span>
                            <span className="text-[10px] text-purple-500 font-mono">HTML rendered below</span>
                          </div>
                          {loadingPreview ? (
                            <div className="p-12 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                            </div>
                          ) : (
                            <iframe
                              srcDoc={previewHtml}
                              className="w-full border-0"
                              style={{ height: "700px" }}
                              title={`Preview: ${email.name}`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl bg-neutral-50 border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-800 mb-2">Notes</h3>
          <ul className="text-sm text-neutral-600 space-y-1.5">
            <li>&bull; <strong>Send Test</strong> sends the real email to your admin email via Resend</li>
            <li>&bull; <strong>Preview</strong> renders the HTML inline so you can check layout without sending</li>
            <li>&bull; All emails use the shared MixReflect wrapper template with consistent branding</li>
            <li>&bull; URLs in test emails point to production (<code className="text-xs bg-neutral-200 px-1 py-0.5 rounded">www.mixreflect.com</code>)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
