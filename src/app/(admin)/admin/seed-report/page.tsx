"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SeedReportPage() {
  const [email, setEmail] = useState("KRIS.ENGELHARDT4@GMAIL.COM");
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSeed = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/seed-release-decision-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to seed report");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <h1 className="text-2xl font-bold text-black mb-2">Seed Release Decision Report</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Attach a mock Release Decision report to a user&apos;s most recent track. Optionally send the report email.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">User Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="h-11"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm font-medium text-neutral-700">
              Also send the report email to the user
            </span>
          </label>

          <Button
            onClick={handleSeed}
            disabled={loading || !email.trim()}
            className="w-full bg-purple-600 text-white hover:bg-purple-700 h-11 font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              "Seed Report"
            )}
          </Button>

          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {result && (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800">Report seeded successfully!</p>
              </div>
              <div className="text-sm text-emerald-700 space-y-1">
                <p><strong>Track:</strong> {result.trackTitle}</p>
                <p><strong>Track ID:</strong> <code className="text-xs bg-emerald-100 px-1.5 py-0.5 rounded">{result.trackId}</code></p>
                <p><strong>Email sent:</strong> {result.emailSent ? "Yes" : "No"}</p>
              </div>
              <div className="pt-2 flex gap-3">
                <Link
                  href={result.viewUrl}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-800 underline underline-offset-2"
                >
                  View in-app report →
                </Link>
                <Link
                  href="/admin/release-decision-report-demo"
                  className="text-sm font-semibold text-neutral-600 hover:text-neutral-800 underline underline-offset-2"
                >
                  View report design demo →
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-neutral-800">How it works</h3>
            <ul className="text-sm text-neutral-600 space-y-2">
              <li>• Finds the user&apos;s most recent track</li>
              <li>• Generates a report from 10 mock expert reviews (FIX_FIRST consensus)</li>
              <li>• Saves the report JSON to the track&apos;s <code className="text-xs bg-neutral-200 px-1 py-0.5 rounded">releaseDecisionReport</code> field</li>
              <li>• If &quot;send email&quot; is checked, sends the full report email via Resend</li>
            </ul>
            <h3 className="text-sm font-bold text-neutral-800 pt-2">Where users see the report</h3>
            <ul className="text-sm text-neutral-600 space-y-2">
              <li>• <strong>In-app:</strong> Artist track detail page (<code className="text-xs bg-neutral-200 px-1 py-0.5 rounded">/artist/tracks/[id]</code>) — the report renders above the review tabs</li>
              <li>• <strong>Email:</strong> Full HTML email sent to the artist with verdict, score, fixes, and a link to the in-app report</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
