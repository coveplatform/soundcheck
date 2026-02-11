"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function TicketReplyForm({
  ticketId,
  ticketStatus,
}: {
  ticketId: string;
  ticketStatus: string;
}) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [error, setError] = useState("");

  const isClosed = ticketStatus === "CLOSED";

  async function send() {
    setError("");

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
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

  async function toggleStatus() {
    setError("");
    setIsTogglingStatus(true);

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isClosed ? "OPEN" : "CLOSED" }),
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
      setIsTogglingStatus(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm p-3 font-medium">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button variant={isClosed ? "primary" : "secondary"} onClick={toggleStatus} isLoading={isTogglingStatus}>
          {isClosed ? "Reopen" : "Close"}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-mono tracking-[0.1em] uppercase text-black/40">Reply</div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[120px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
          maxLength={4000}
          disabled={isClosed}
        />
      </div>

      <div>
        <Button onClick={send} isLoading={isSending} disabled={isClosed}>
          Send
        </Button>
      </div>
    </div>
  );
}
