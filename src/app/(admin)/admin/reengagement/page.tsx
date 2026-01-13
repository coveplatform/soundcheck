"use client";

import { useState, useEffect } from "react";

type TrialUser = {
  id: string;
  email: string;
  artistName: string;
  freeCredits: number;
  signedUpAt: string;
};

type Lead = {
  id: string;
  email: string;
  artistName: string | null;
  source: string;
  capturedAt: string;
};

type TrialUsersData = {
  eligible: TrialUser[];
  stats: {
    eligibleCount: number;
    alreadyRemindedCount: number;
  };
};

type LeadsData = {
  eligible: Lead[];
  stats: {
    eligibleCount: number;
    alreadyRemindedCount: number;
    convertedCount: number;
  };
};

export default function ReengagementPage() {
  const [trialData, setTrialData] = useState<TrialUsersData | null>(null);
  const [leadsData, setLeadsData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<"trial" | "leads" | null>(null);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trialRes, leadsRes] = await Promise.all([
        fetch("/api/admin/reengagement/trial-users"),
        fetch("/api/admin/reengagement/leads"),
      ]);

      if (trialRes.ok) {
        setTrialData(await trialRes.json());
      }
      if (leadsRes.ok) {
        setLeadsData(await leadsRes.json());
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendTrialEmails = async () => {
    if (!confirm(`Send reminder emails to ${trialData?.stats.eligibleCount} trial users?`)) {
      return;
    }

    setSending("trial");
    setMessage(null);

    try {
      const res = await fetch("/api/admin/reengagement/trial-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Sent ${data.sent} emails to trial users` });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send emails" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSending(null);
    }
  };

  const sendLeadEmails = async () => {
    if (!confirm(`Send reminder emails to ${leadsData?.stats.eligibleCount} leads?`)) {
      return;
    }

    setSending("leads");
    setMessage(null);

    try {
      const res = await fetch("/api/admin/reengagement/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Sent ${data.sent} emails to leads` });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send emails" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSending(null);
    }
  };

  const resetReminders = async () => {
    if (!confirm("Reset all reminder flags? This will make previously reminded users eligible again.")) {
      return;
    }

    setResetting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/reengagement/reset", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Reset ${data.trialUsersReset} trial users and ${data.leadsReset} leads`,
        });
        fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to reset" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Re-engagement</h1>
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Re-engagement</h1>
          <p className="text-neutral-500">Send reminder emails to inactive users</p>
        </div>
        <button
          onClick={resetReminders}
          disabled={resetting}
          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          {resetting ? "Resetting..." : "Reset All Flags"}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Trial Users Section */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Free Trial Users</h2>
              <p className="text-sm text-neutral-500">
                Users who signed up but never submitted a track
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/reengagement/preview?type=trial"
                target="_blank"
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Preview Email
              </a>
              <button
                onClick={sendTrialEmails}
                disabled={sending !== null || (trialData?.stats.eligibleCount ?? 0) === 0}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800"
              >
                {sending === "trial" ? "Sending..." : `Send to ${trialData?.stats.eligibleCount ?? 0}`}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{trialData?.stats.eligibleCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Eligible to email</div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{trialData?.stats.alreadyRemindedCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Already reminded</div>
            </div>
          </div>
        </div>

        {trialData && trialData.eligible.length > 0 && (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 sticky top-0">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Email</th>
                  <th className="text-left font-medium px-4 py-2">Artist Name</th>
                  <th className="text-left font-medium px-4 py-2">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {trialData.eligible.slice(0, 50).map((user) => (
                  <tr key={user.id} className="text-neutral-700">
                    <td className="px-4 py-2 font-mono text-xs">{user.email}</td>
                    <td className="px-4 py-2">{user.artistName}</td>
                    <td className="px-4 py-2 text-neutral-500">
                      {new Date(user.signedUpAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trialData.eligible.length > 50 && (
              <div className="px-4 py-2 text-sm text-neutral-500 bg-neutral-50">
                ...and {trialData.eligible.length - 50} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leads Section */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Unconverted Leads</h2>
              <p className="text-sm text-neutral-500">
                People who started signup but never finished
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/reengagement/preview?type=lead"
                target="_blank"
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Preview Email
              </a>
              <button
                onClick={sendLeadEmails}
                disabled={sending !== null || (leadsData?.stats.eligibleCount ?? 0) === 0}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800"
              >
                {sending === "leads" ? "Sending..." : `Send to ${leadsData?.stats.eligibleCount ?? 0}`}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-neutral-50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{leadsData?.stats.eligibleCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Eligible to email</div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{leadsData?.stats.alreadyRemindedCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Already reminded</div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg">
              <div className="text-2xl font-bold">{leadsData?.stats.convertedCount ?? 0}</div>
              <div className="text-xs text-neutral-500">Converted</div>
            </div>
          </div>
        </div>

        {leadsData && leadsData.eligible.length > 0 && (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 sticky top-0">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Email</th>
                  <th className="text-left font-medium px-4 py-2">Artist Name</th>
                  <th className="text-left font-medium px-4 py-2">Source</th>
                  <th className="text-left font-medium px-4 py-2">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leadsData.eligible.slice(0, 50).map((lead) => (
                  <tr key={lead.id} className="text-neutral-700">
                    <td className="px-4 py-2 font-mono text-xs">{lead.email}</td>
                    <td className="px-4 py-2">{lead.artistName || "-"}</td>
                    <td className="px-4 py-2">{lead.source}</td>
                    <td className="px-4 py-2 text-neutral-500">
                      {new Date(lead.capturedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leadsData.eligible.length > 50 && (
              <div className="px-4 py-2 text-sm text-neutral-500 bg-neutral-50">
                ...and {leadsData.eligible.length - 50} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
