"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const STATUSES = ["OPEN", "NEEDS_INFO", "RESOLVED", "CLOSED"] as const;

export function SupportTicketActions({
  ticketId,
  initialStatus,
}: {
  ticketId: string;
  initialStatus: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus() {
    setError("");
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to update status");
        return;
      }

      router.refresh();
    } catch {
      setError("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function sendMessage() {
    setError("");

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to send message");
        return;
      }

      setMessage("");
      router.refresh();
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="bg-red-50 border-2 border-red-500 text-red-600 text-sm p-3 font-medium">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-sm text-neutral-600 font-bold">Status</div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 px-3 border-2 border-black text-sm bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button onClick={updateStatus} isLoading={isUpdating}>
            Update
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-neutral-600 font-bold">Reply</div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border-2 border-black text-sm min-h-[160px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          maxLength={4000}
        />
      </div>

      <div>
        <Button variant="primary" onClick={sendMessage} isLoading={isSending}>
          Send
        </Button>
      </div>
    </div>
  );
}
