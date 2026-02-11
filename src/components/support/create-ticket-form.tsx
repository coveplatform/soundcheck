"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateTicketForm() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to create ticket");
        return;
      }

      const ticketId = data?.ticketId as string | undefined;
      if (ticketId) {
        router.push(`/support/tickets/${ticketId}`);
        router.refresh();
        return;
      }

      router.refresh();
    } catch {
      setError("Failed to create ticket");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm p-3 font-medium">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-xs font-mono tracking-[0.1em] uppercase text-black/40">Subject</div>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-mono tracking-[0.1em] uppercase text-black/40">Message</div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm min-h-[140px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1"
          maxLength={4000}
        />
      </div>

      <div>
        <Button variant="primary" onClick={submit} isLoading={isLoading}>
          Submit ticket
        </Button>
      </div>
    </div>
  );
}
